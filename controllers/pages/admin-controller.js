const { Restaurant, User, Category } = require('../../models')
const { imgurFileHandler } = require('../../helpers/file-helpers')
const adminServices = require('../../services/admin-services')

const adminController = {
  getRestaurants: (req, res, next) => {
    adminServices.getRestaurants(req, (err, data) => (err ? next(err) : res.render('admin/restaurants', data)))
  },
  createRestaurant: (req, res, next) => {
    return Category.findAll({
      raw: true
    })
      .then(categories => res.render('admin/create-restaurant', { categories }))
      .catch(err => next(err))
  },
  postRestaurant: (req, res, next) => {
    adminServices.postRestaurant(req, (err, data) => {
      if (err) return next(err)
      req.flash('success_messages', 'restaurant was successfully created')
      // res.redirect('/admin/restaurants', data)
      // 跟delete一樣先拿掉data
      res.redirect('/admin/restaurants')
    })
  },
  getRestaurant: (req, res, next) => {
    Restaurant.findByPk(req.params.id, {
      // 去資料庫用 id 找一筆資料
      raw: true, // 找到以後整理格式再回傳
      nest: true,
      include: [Category]
    })
      .then(restaurant => {
        if (!restaurant) throw new Error("Restaurant didn't exist!") // 如果找不到，回傳錯誤訊息，後面不執行
        res.render('admin/restaurant', { restaurant })
      })
      .catch(err => next(err))
  },
  editRestaurant: (req, res, next) => {
    return Promise.all([Restaurant.findByPk(req.params.id, { raw: true }), Category.findAll({ raw: true })])
      .then(([restaurant, categories]) => {
        if (!restaurant) throw new Error("Restaurant doesn't exist!")
        res.render('admin/edit-restaurant', { restaurant, categories })
      })
      .catch(err => next(err))
  },
  putRestaurant: (req, res, next) => {
    const { name, tel, address, openingHours, description, categoryId } = req.body
    if (!name) throw new Error('Restaurant name is required!')
    const { file } = req // 把檔案取出來
    Promise.all([
      // 非同步處理
      Restaurant.findByPk(req.params.id), // 去資料庫查有沒有這間餐廳
      // 這段不需要 { raw: true } 因為update需要sequelize物件的形式 所以不須過慮成乾淨的資料
      imgurFileHandler(file) // 把檔案傳到 file-helper 處理
    ])
      .then(([restaurant, filePath]) => {
        if (!restaurant) throw new Error("Restaurant didn't exist!")
        return restaurant.update({
          name,
          tel,
          address,
          openingHours,
          description,
          image: filePath || restaurant.image,
          categoryId
        })
      })
      .then(() => {
        req.flash('success_messages', 'restaurant was successfully to update')
        res.redirect('/admin/restaurants')
      })
      .catch(err => next(err))
  },
  deleteRestaurant: (req, res, next) => {
    // adminServices.deleteRestaurant(req, (err, data) => (err ? next(err) : res.redirect('/admin/restaurants', data)))
    // express redirect 2.0版本是 res.redirect(url[, status])
    // 3.0版本以後已經改成 res.redirect([status,] path)
    // 但這個狀況是沒有 status 卻想要包含第三個參數 data ?
    // 因為講師想要留給前端如果想要顯示被刪除的data的話可以使用
    // 但前端使用的應該是API? 所以其實不需要第三個參數?
    adminServices.deleteRestaurant(req, err => (err ? next(err) : res.redirect('/admin/restaurants')))
  },
  getUsers: (req, res, next) => {
    return User.findAll({
      raw: true
    })
      .then(users => res.render('admin/users', { users }))
      .catch(err => next(err))
  },
  patchUser: (req, res) => {
    return User.findByPk(req.params.id).then(user => {
      if (!user) throw new Error("User didn't exist!")
      if (user.email === 'root@example.com') {
        req.flash('error_messages', '禁止變更 root 權限')
        return res.redirect('back')
      }
      user
        .update({
          isAdmin: !user.isAdmin
        })
        .then(() => {
          req.flash('success_messages', '使用者權限變更成功')
          return res.redirect('/admin/users')
        })
    })
  }
}

module.exports = adminController
