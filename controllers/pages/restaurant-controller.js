const { Restaurant, Category, Comment, User, Favorite } = require('../../models')
const restaurantServices = require('../../services/restaurant-services')

const restaurantController = {
  getRestaurants: (req, res, next) => {
    restaurantServices.getRestaurants(req, (err, data) => (err ? next(err) : res.render('restaurants', data)))
  },
  getRestaurant: (req, res, next) => {
    return Restaurant.findByPk(req.params.id, {
      include: [
        Category, // 拿出關聯的 Category model
        { model: Comment, include: User }, // 拿出關聯的 Category model 關聯的 User model
        { model: User, as: 'FavoritedUsers' },
        { model: User, as: 'LikedUsers' }
      ],
      order: [[Comment, 'updatedAt', 'DESC']]
    })
      .then(restaurant => {
        const isFavorited = restaurant.FavoritedUsers.some(f => f.id === req.user.id)
        const isLiked = restaurant.LikedUsers.some(l => l.id === req.user.id)
        if (!restaurant) throw new Error("Restaurant didn't exist!")
        restaurant.increment('viewCounts')
        return res.render('restaurant', { restaurant: restaurant.toJSON(), isFavorited, isLiked })
      })
      .catch(err => next(err))
  },
  getDashboard: async (req, res, next) => {
    try {
      const id = req.params.id
      const restaurant = await Restaurant.findByPk(id, {
        include: [Category, Comment],
        nest: true
      })
      const favorite = await Favorite.findAll({
        where: { restaurantId: id },
        raw: true,
        nest: true
      })
      if (!restaurant) throw new Error("Restaurant didn't exist!")
      const comment = restaurant.Comments
      return res.render('dashboard', { restaurant: restaurant.toJSON(), comment, favorite })
    } catch (error) {
      next(error)
    }
  },
  getFeeds: (req, res, next) => {
    return Promise.all([
      Restaurant.findAll({
        limit: 10,
        order: [['createdAt', 'DESC']],
        include: [Category],
        raw: true,
        nest: true
      }),
      Comment.findAll({
        limit: 10,
        order: [['createdAt', 'DESC']],
        include: [User, Restaurant],
        raw: true,
        nest: true
      })
    ])
      .then(([restaurants, comments]) => {
        res.render('feeds', {
          restaurants,
          comments
        })
      })
      .catch(err => next(err))
  },
  getTopRestaurants: (req, res, next) => {
    const topLimit = 10
    return Restaurant.findAll({
      include: [{ model: User, as: 'FavoritedUsers' }]
    })
      .then(restaurants => {
        const result = restaurants
          .map(restaurant => ({
            ...restaurant.toJSON(),
            favoritedCount: restaurant.FavoritedUsers.length,
            isFavorited: restaurant.FavoritedUsers.some(fu => fu.id === req.user.id)
          }))
          .sort((a, b) => b.favoritedCount - a.favoritedCount)
          .slice(0, topLimit)
        res.render('top-restaurants', { restaurants: result })
      })
      .catch(err => next(err))
  }
}
module.exports = restaurantController
