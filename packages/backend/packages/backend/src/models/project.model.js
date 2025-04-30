const { Model, DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const User = require('./user.model');

class Project extends Model {
  // Instance methods can be added here
  
  // Method to check if project is assignable to a service provider
  isAssignable() {
    return this.status === 'open';
  }
  
  // Method to find projects matching a service provider's skills
  static async findBySkills(skills) {
    return await Project.findAll({
      where: {
        status: 'open',
        // Use Sequelize's array operators to find projects requiring any of the provider's skills
        // This might vary based on the database dialect
      },
      order: [['createdAt', 'DESC']]
    });
  }
}

Project.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'Project title cannot be empty',
        },
        len: {
          args: [5, 100],
          msg: 'Project title must be between 5 and 100 characters',
        },
      },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'Project description cannot be empty',
        },
        len: {
          args: [20, 5000],
          msg: 'Project description must be between 20 and 5000 characters',
        },
      },
    },
    budgetMinimum: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: {
          args: [0],
          msg: 'Budget minimum cannot be negative',
        },
      },
    },
    budgetMaximum: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: {
          args: [0],
          msg: 'Budget maximum cannot be negative',
        },
        isGreaterThanMin(value) {
          if (parseFloat(value) < parseFloat(this.budgetMinimum)) {
            throw new Error('Budget maximum must be greater than or equal to budget minimum');
          }
        },
      },
    },
    deadline: {
      type: DataTypes.DATE,
      allowNull: false,
      validate: {
        isDate: {
          msg: 'Deadline must be a valid date',
        },
        isFuture(value) {
          if (new Date(value) <= new Date()) {
            throw new Error('Deadline must be in the future');
          }
        },
      },
    },
    status: {
      type: DataTypes.ENUM('open', 'in_progress', 'completed', 'cancelled'),
      allowNull: false,
      defaultValue: 'open',
    },
    clientId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    assignedToId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    skills: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: false,
      defaultValue: [],
      validate: {
        notEmpty: {
          msg: 'Project must require at least one skill',
        },
      },
    },
    category: {
      type: DataTypes.ENUM(
        'web_development',
        'mobile_app',
        'design',
        'marketing',
        'data_science',
        'game_development',
        'devops',
        'other'
      ),
      allowNull: false,
    },
    attachments: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: true,
      defaultValue: [],
    },
  },
  {
    sequelize,
    modelName: 'Project',
    tableName: 'projects',
    timestamps: true,
  }
);

// Define associations
Project.belongsTo(User, {
  foreignKey: 'clientId',
  as: 'client',
  constraints: false,
});

Project.belongsTo(User, {
  foreignKey: 'assignedToId',
  as: 'assignedTo',
  constraints: false,
});

// User has many projects (as client)
User.hasMany(Project, {
  foreignKey: 'clientId',
  as: 'clientProjects',
  constraints: false,
});

// User has many projects (as service provider)
User.hasMany(Project, {
  foreignKey: 'assignedToId',
  as: 'assignedProjects',
  constraints: false,
});

module.exports = Project;

