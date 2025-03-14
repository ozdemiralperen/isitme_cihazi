const { getDB } = require('../db');

class Contact {
  static async create(contactData) {
    const db = getDB();
    const result = await db.collection('contacts').insertOne(contactData);
    return result;
  }

  static async getAll() {
    const db = getDB();
    const contacts = await db.collection('contacts').find({}).toArray();
    return contacts;
  }
}

module.exports = Contact;