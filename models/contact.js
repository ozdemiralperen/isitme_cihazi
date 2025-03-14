const { getConnection } = require('../db');

class Contact {
  static async create(contactData) {
    const connection = getConnection();
    const db = connection.db;
    const result = await db.collection('contacts').insertOne(contactData);
    return result;
  }

  static async getAll() {
    const connection = getConnection();
    const db = connection.db;
    const contacts = await db.collection('contacts').find({}).toArray();
    return contacts;
  }
}

module.exports = Contact;