const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const Note = sequelize.define("Note", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: ""
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
    defaultValue: ""
  },
  tags: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: []
  },
  isPinned: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  isArchived: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  isDeleted: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  priority: {
    type: DataTypes.ENUM("low", "medium", "high", "urgent"),
    allowNull: false,
    defaultValue: "medium"
  },
  deletedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  // Integration fields
  deadline: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: null
  },
  news: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: null
  },
  financial: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: null
  },
  social: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: null
  },
  intelligence: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: null
  },
  attachments: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: []
  },
  drawings: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: []
  }
}, {
  tableName: "notes",
  timestamps: true,
  createdAt: "createdAt",
  updatedAt: "updatedAt",
  indexes: [
    { fields: ["isDeleted"] },
    { fields: ["isPinned"] },
    { fields: ["isArchived"] },
    { fields: ["priority"] },
    { fields: ["createdAt"] },
    { fields: ["updatedAt"] }
  ]
});

module.exports = Note;

