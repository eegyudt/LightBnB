const properties = require('./json/properties.json');
const users = require('./json/users.json');
const { Pool } = require('pg');
const pool = new Pool({
  user: 'labber',
  password: 'labber',
  host: 'localhost',
  database: 'lightbnb'
});
pool.query(`SELECT title FROM properties LIMIT 10;`).then(response => {
  // console.log(response);
});


/// Users

/**
 * Get a single user from the database given their email.
 * @param {String} emailAddress The email of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithEmail = function(emailAddress) {

  return pool.query(`SELECT * FROM users WHERE email = $1`, [emailAddress])
    .then((result) => {

      if (result.rows.length <= 0) {
        return null;
      }
      return Promise.resolve(result.rows[0]);
    })
    .catch((err) => {
      console.log(err.message);
    });
};

exports.getUserWithEmail = getUserWithEmail;

/**
 * Get a single user from the database given their id.
 * @param {string} id The id of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithId = function(id) {

  return pool.query(`SELECT * FROM users WHERE id = $1`, [id])
    .then((result) => {

      if (result) {
        return result.rows[0];
      }
      return null;
    })
    .catch((err) => {
      console.log(err.message);
    });
};
exports.getUserWithId = getUserWithId;


/**
 * Add a new user to the database.
 * @param {{name: string, password: string, email: string}} user
 * @return {Promise<{}>} A promise to the user.
 */
const addUser = function(user) {

  return pool.query(`INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING *;`, [user.name, user.email, user.password])
    .then((result) => {

      return result.rows[0];
    })
    .catch((err) => {
      console.log(err.message);
    });
};
exports.addUser = addUser;

/// Reservations

/**
 * Get all reservations for a single user.
 * @param {string} guest_id The id of the user.
 * @return {Promise<[{}]>} A promise to the reservations.
 */


const getAllReservations = function(guest_id, limit = 10) {
  const sqlQuery = `SELECT reservations.*, properties.*, AVG(property_reviews.rating) as average_rating
  FROM reservations
  JOIN properties ON properties.id = property_id
  JOIN property_reviews ON property_reviews.reservation_id = reservations.id
  WHERE reservations.guest_id = $1
  GROUP BY reservations.id, properties.id
  LIMIT $2+1;`;
  const sqlValues = [guest_id, limit];
  return pool.query(sqlQuery, sqlValues)
    .then((result) => {
      console.log(result.rows);

      return Promise.resolve(result.rows);
    })
    .catch((err) => {
      console.log(err.message);
    });
};
exports.getAllReservations = getAllReservations;

/// Properties

/**
 * Get all properties.
 * @param {{}} options An object containing query options.
 * @param {*} limit The number of results to return.
 * @return {Promise<[{}]>}  A promise to the properties.
 */
const getAllProperties = (options, limit = 10) => {

  // 1
  const queryParams = [];
  // 2
  let queryString = `
  SELECT properties.*, avg(property_reviews.rating) as average_rating
  FROM properties
  JOIN property_reviews ON properties.id = property_id
  `;

  // 3
  if (options.city) {
    queryParams.push(`%${options.city}%`);
    queryString += ` WHERE city LIKE $${queryParams.length} `;
  }

  if (options.owner_id) {
    queryParams.push(options.owner_id);
    queryString += ` AND owner_id = $${queryParams.length} `;
  }

  if (options.minimum_price_per_night && options.maximum_price_per_night) {
    queryParams.push(options.minimum_price_per_night * 100);
    queryParams.push(options.maximum_price_per_night * 100);
    queryString += ` AND cost_per_night >= $${queryParams.length - 1} AND cost_per_night <= $${queryParams.length}`;
  }

  // 4
  queryString += `
  GROUP BY properties.id`;
  
  if (options.minimum_rating) {
    queryParams.push(options.minimum_rating);
    queryString += ` HAVING avg(rating) >= $${queryParams.length}`;
  }
  queryParams.push(limit);

  queryString += ` ORDER BY cost_per_night
  LIMIT $${queryParams.length};
  `;

  // 5
  console.log(queryString, queryParams);

  // 6
  return pool.query(queryString, queryParams).then((res) => res.rows);
};
exports.getAllProperties = getAllProperties;

// return pool.query(`SELECT properties.*, AVG(property_reviews.rating) as average_rating 
//   FROM properties 
//   JOIN property_reviews ON property_reviews.property_id = properties.id 
//   GROUP BY properties.id
//   LIMIT $1`, [limit])
//     .then((result) => {
//       return result.rows;
//     })
//     .catch((err) => {
//       console.log(err.message);
//     });


/**
 * Add a property to the database
 * @param {{}} property An object containing all of the property details.
 * @return {Promise<{}>} A promise to the property.
 */
const addProperty = function(property) {
  const propertyId = Object.keys(properties).length + 1;
  property.id = propertyId;
  properties[propertyId] = property;
  return Promise.resolve(property);
};
exports.addProperty = addProperty;

