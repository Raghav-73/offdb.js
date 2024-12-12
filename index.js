const fs = require("fs");
const path = require("path");

/**
 * OffDB: A lightweight, serverless JSON-based NoSQL database.
 * Ideal for offline-first applications like Electron apps.
 */
class OffDB {
  constructor(dbPath = "./database") {
    this.DB_ROOT = path.resolve(dbPath);
    if (!fs.existsSync(this.DB_ROOT)) {
      fs.mkdirSync(this.DB_ROOT, { recursive: true });
    }
  }

  getCollection(collectionName) {
    const collectionPath = path.join(this.DB_ROOT, collectionName);
    if (!fs.existsSync(collectionPath)) {
      fs.mkdirSync(collectionPath);
    }
    return collectionPath;
  }

  insert(collectionName, data) {
    const collectionPath = this.getCollection(collectionName);
    const id = Date.now().toString();
    const filePath = path.join(collectionPath, `${id}.json`);
    fs.writeFileSync(filePath, JSON.stringify({ id, ...data }, null, 2));
    return id;
  }

  find(collectionName, query = {}) {
    const collectionPath = this.getCollection(collectionName);
    const files = fs.readdirSync(collectionPath);
    return files
      .map((file) => {
        const content = JSON.parse(
          fs.readFileSync(path.join(collectionPath, file))
        );
        return Object.keys(query).every((key) => content[key] === query[key])
          ? content
          : null;
      })
      .filter(Boolean);
  }

  update(collectionName, id, data) {
    const collectionPath = this.getCollection(collectionName);
    const filePath = path.join(collectionPath, `${id}.json`);
    if (!fs.existsSync(filePath)) {
      throw new Error("Document not found");
    }
    const existingData = JSON.parse(fs.readFileSync(filePath));
    const updatedData = { ...existingData, ...data };
    fs.writeFileSync(filePath, JSON.stringify(updatedData, null, 2));
    return updatedData;
  }

  delete(collectionName, id) {
    const collectionPath = this.getCollection(collectionName);
    const filePath = path.join(collectionPath, `${id}.json`);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    return false;
  }

  populate(document, populateFields) {
    const populatedDocument = { ...document };

    populateFields.forEach(({ path: refField, collection: refCollection }) => {
      const refId = document[refField];
      if (!refId) return;

      const refDocument = this.find(refCollection, { id: refId })[0];
      if (refDocument) {
        populatedDocument[refField] = refDocument;
      }
    });

    return populatedDocument;
  }
}

module.exports = OffDB;
