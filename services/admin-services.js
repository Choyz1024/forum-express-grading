const { Restaurant, Category } = require('../models')
// const { imgurFileHandler } = require('../../helpers/file-helpers')
const { getOffset, getPagination } = require('../helpers/pagination-helper')

const adminController = {
  getRestaurants: (req, cb) => {
    const DEFAULT_LIMIT = 10
    const page = Number(req.query.page) || 1
    const limit = Number(req.query.limit) || DEFAULT_LIMIT
    const offset = getOffset(limit, page)
    return Restaurant.findAndCountAll({
      limit,
      offset,
      raw: true,
      nest: true,
      include: [Category]
    })
      .then(restaurants => {
        const data = restaurants.rows
        return cb(null, {
          restaurants: data,
          pagination: getPagination(limit, page, restaurants.count)
        })
      })
      .catch(err => cb(err))
  }
}

module.exports = adminController
