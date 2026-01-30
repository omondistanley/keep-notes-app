const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const Notification = sequelize.define("Notification", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  type: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: "info"
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: ""
  },
  body: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  noteId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  link: {
    type: DataTypes.STRING,
    allowNull: true
  },
  read: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  }
}, {
  tableName: "notifications",
  timestamps: true,
  createdAt: "createdAt",
  updatedAt: "updatedAt",
  indexes: [
    { fields: ["read"] },
    { fields: ["createdAt"] },
    { fields: ["type"] }
  ]
});

module.exports = Notification;
