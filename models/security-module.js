const { Sequelize, DataTypes } = require('sequelize');
const { db } = require('../database/connection')

const Usuario = db.define('Usuario', {
    idUsuario: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    nombreUsuario: {
        type: DataTypes.STRING,
    },
    contrasena: {
        type: DataTypes.STRING,
    },
    estado: {
        type: DataTypes.INTEGER
    }
}, {
    tableName: 'Usuario',
    timestamps: false,
});

// Modelo Grupo
const Grupo = db.define('Grupo', {
    idGrupo: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    nombreGrupo: {
        type: DataTypes.STRING,
    },
}, {
    tableName: 'Grupo',
    timestamps: false,
});

// Modelo Permiso
const Permiso = db.define('Permiso', {
    idPermiso: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    nombrePermiso: {
        type: DataTypes.STRING,
    },
}, {
    tableName: 'Permiso',
    timestamps: false,
});

const UsuarioGrupo = db.define('UsuarioGrupo', {}, { tableName: 'UsuarioGrupo', timestamps: false });

Usuario.belongsToMany(Grupo, { through: UsuarioGrupo, foreignKey: 'idUsuario' });
Grupo.belongsToMany(Usuario, { through: UsuarioGrupo, foreignKey: 'idGrupo' });

const UsuarioPermiso = db.define('UsuarioPermiso', {}, { tableName: 'UsuarioPermiso', timestamps: false });

Usuario.belongsToMany(Permiso, { through: UsuarioPermiso, foreignKey: 'idUsuario' });
Permiso.belongsToMany(Usuario, { through: UsuarioPermiso, foreignKey: 'idPermiso' });

const GrupoPermiso = db.define('GrupoPermiso', {}, { tableName: 'GrupoPermiso', timestamps: false });

Grupo.belongsToMany(Permiso, { through: GrupoPermiso, foreignKey: 'idGrupo' });
Permiso.belongsToMany(Grupo, { through: GrupoPermiso, foreignKey: 'idPermiso' });

const GrupoGrupo = db.define('GrupoGrupo', {}, { tableName: 'GrupoGrupo', timestamps: false });

Grupo.belongsToMany(Grupo, { through: GrupoGrupo, as: 'GrupoPadre', foreignKey: 'idGrupoPadre' });
Grupo.belongsToMany(Grupo, { through: GrupoGrupo, as: 'GrupoHijo', foreignKey: 'idGrupoHijo' });

const UsuarioAdmin = db.define('UsuarioAdmin', {
    idUsuario: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        references: {
            model: 'Usuario',
            key: 'idUsuario',
        },
    },
    idAdmin: {
        type: DataTypes.INTEGER,
        references: {
            model: 'Usuario',
            key: 'idUsuario',
        },
    },
}, {
    tableName: 'UsuarioAdmin',
    timestamps: false,
});

Usuario.belongsToMany(Usuario, { through: UsuarioAdmin, foreignKey: 'idAdmin', as: 'Admin' });
Usuario.belongsToMany(Usuario, { through: UsuarioAdmin, foreignKey: 'idUsuario', as: 'Usuario' });



db.sync()
    .then(() => {
        console.log('Modelos sincronizados con la base de datos.');
    })
    .catch((error) => {
        console.error('Error al sincronizar modelos con la base de datos:', error);
    });

module.exports = {
    Usuario,
    Grupo,
    Permiso,
    UsuarioGrupo,
    UsuarioPermiso,
    UsuarioAdmin,
    GrupoPermiso,
    GrupoGrupo,
};