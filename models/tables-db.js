const { Sequelize, DataTypes } = require('sequelize');
const { db } = require('../database/connection');
const { Usuario } = require('../models/security-module')

const Administrador = db.define('Administrador', {
    email: {
        type: DataTypes.STRING,
        primaryKey: true,
    },
}, {
    tableName: 'Administrador',
    timestamps: false,
});

const Repartidor = db.define('Repartidor', {
    email: {
        type: DataTypes.STRING,
        primaryKey: true,
    },
    camion: {
        type: DataTypes.STRING,
    },
    administrador_email: {
        type: DataTypes.STRING
    }
}, {
    tableName: 'Repartidor',
    timestamps: false,
});

Repartidor.belongsTo(Administrador, { foreignKey: 'administrador_email' });

const Preventista = db.define('Preventista', {
    email: {
        type: DataTypes.STRING,
        primaryKey: true,
    },
    administrador_email: {
        type: DataTypes.STRING
    }
}, {
    tableName: 'Preventista',
    timestamps: false,
});

Preventista.belongsTo(Administrador, { foreignKey: 'administrador_email' });

const Cliente = db.define('Cliente', {
    idCliente: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    nombre: {
        type: DataTypes.STRING,
    },
    direccion: {
        type: DataTypes.STRING,
    },
    horarioEntrega: {
        type: DataTypes.STRING,
    },
}, {
    tableName: 'Cliente',
    timestamps: false,
});

const ClienteUsuario = db.define('ClienteUsuario', {
    idUsuario: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
    },
    idCliente: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
    },
}, {
    tableName: 'ClienteUsuario',
    timestamps: false,
});

ClienteUsuario.belongsTo(Usuario, { foreignKey: 'idUsuario' });
ClienteUsuario.belongsTo(Cliente, { foreignKey: 'idCliente' });

const Pedido = db.define('Pedido', {
    idPedido: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    idCliente: {
        type: DataTypes.INTEGER,
    },
    nota: {
        type: DataTypes.TEXT,
    },
    preventista_email: {
        type: DataTypes.STRING,
    },
    estado: {
        type: DataTypes.STRING,
    },
    fecha: {
        type: DataTypes.DATE,
    },
}, {
    tableName: 'Pedido',
    timestamps: false,
});

Pedido.belongsTo(Preventista, { foreignKey: 'preventista_email' });
Pedido.belongsTo(Cliente, { foreignKey: 'idCliente' });

const Cantidad = db.define('Cantidad', {
    unidad: {
        type: DataTypes.STRING,
        primaryKey: true,
    },
}, {
    tableName: 'Cantidad',
    timestamps: false,
});

const ListaDePrecios = db.define('ListaDePrecios', {
    idLista: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    nombre: {
        type: DataTypes.STRING,
    },
    fechaVigencia: {
        type: DataTypes.DATE,
    },
}, {
    tableName: 'ListaDePrecios',
    timestamps: false,
});

const Preventista_ListaDePrecio = db.define('Preventista_ListaDePrecio', {
    idLista: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        primaryKey: true
    },
    email_administrador: {
        type: DataTypes.STRING
    }
}, {
    tableName: 'Preventista_ListaDePrecio',
    timestamps: false,
});

Preventista_ListaDePrecio.belongsTo(ListaDePrecios, { foreignKey: 'idLista' });
Preventista_ListaDePrecio.belongsTo(Preventista, { foreignKey: 'email' });


const Producto = db.define('Producto', {
    idProducto: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    nombre: {
        type: DataTypes.STRING,
    },
    marca: {
        type: DataTypes.STRING,
    },
    presentacion: {
        type: DataTypes.STRING,
    },
    cantidad_unidad: {
        type: DataTypes.STRING,
    }
}, {
    tableName: 'Producto',
    timestamps: false,
});

Producto.belongsTo(Cantidad, { foreignKey: 'cantidad_unidad' });

const LineaPedido = db.define('LineaPedido', {
    idProducto: {
        type: DataTypes.INTEGER,
        primaryKey: true
    },
    idPedido: {
        type: DataTypes.INTEGER,
        primaryKey: true,
    },
    cantidad: {
        type: DataTypes.INTEGER,
    },
    precio: {
        type: DataTypes.INTEGER,
    },
    fecha: {
        type: DataTypes.DATE,
    },
}, {
    tableName: 'LineaPedido',
    timestamps: false,
});

LineaPedido.belongsTo(Pedido, { foreignKey: 'idPedido' });
LineaPedido.belongsTo(Producto, { foreignKey: 'idProducto' });

const Producto_ListaDePrecio = db.define('Producto_ListaDePrecio', {
    idLista: {
        type: DataTypes.INTEGER,
        field: 'idLista',
        primaryKey: true,
    },
    idProducto: {
        type: DataTypes.INTEGER,
        field: 'idProducto',
        primaryKey: true,
    },
    precioUnitario: {
        type: DataTypes.DECIMAL(10, 2),
        field: 'precioUnitario',
    },
}, {
    tableName: 'Producto_ListaDePrecio',
    timestamps: false,
});

Producto_ListaDePrecio.belongsTo(ListaDePrecios, { foreignKey: 'idLista' });
Producto_ListaDePrecio.belongsTo(Producto, { foreignKey: 'idProducto' });

const AuditoriaRecomendados = db.define('AuditoriaRecomendados', {
    idAuditoria: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    idUsuario: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Usuario',
            key: 'idUsuario',
        },
    },
    idCliente: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Cliente',
            key: 'idCliente',
        },
    },
    fechaCreacion: {
        type: DataTypes.DATE,
        allowNull: false,
    },
}, {
    tableName: 'AuditoriaRecomendados',
    timestamps: false,
});

AuditoriaRecomendados.belongsTo(Cliente, { foreignKey: 'idCliente' });
AuditoriaRecomendados.belongsTo(Usuario, { foreignKey: 'idUsuario' });

const AuditoriaCambioEstadoPedido = db.define('AuditoriaCambioEstadoPedido', {
    idAuditoria: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    idUsuario: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Usuario',
            key: 'idUsuario',
        },
    },
    idPedido: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Pedido',
            key: 'idPedido',
        },
    },
    fechaCreacion: {
        type: DataTypes.DATE,
        allowNull: false,
    },
    estado: {
        type: DataTypes.STRING,
        allowNull: false,
    }
}, {
    tableName: 'AuditoriaCambioEstadoPedido',
    timestamps: false,
});

AuditoriaCambioEstadoPedido.belongsTo(Pedido, { foreignKey: 'idPedido' });
AuditoriaCambioEstadoPedido.belongsTo(Usuario, { foreignKey: 'idUsuario' });

const AuditoriaListaDePrecios = db.define('AuditoriaListaDePrecios', {
    idAuditoria: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    idLista: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'ListaDePrecios',
            key: 'idLista',
        },
    },
    idUsuario: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Usuario',
            key: 'idUsuario',
        },
    },
    nombre: {
        type: DataTypes.STRING,
        allowNull: false,
        references: {
            model: 'ListaDePrecios',
            key: 'nombre',
        },
    },
    fechaVigencia: {
        type: DataTypes.DATE,
        allowNull: false
    },
    fechaCreacion: {
        type: DataTypes.DATE,
        allowNull: false,
    }
}, {
    tableName: 'AuditoriaListaDePrecios',
    timestamps: false,
});

AuditoriaListaDePrecios.belongsTo(ListaDePrecios, { foreignKey: 'idLista' });

const AuditoriaCliente = db.define('AuditoriaCliente', {
    idAuditoria: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    idCliente: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Cliente',
            key: 'idCliente',
        },
    },
    fechaCreacion: {
        type: DataTypes.DATE,
        allowNull: false,
    }
}, {
    tableName: 'AuditoriaCliente',
    timestamps: false,
});

AuditoriaCliente.belongsTo(Cliente, { foreignKey: 'idCliente' });

db.sync()
    .then(() => {
        console.log('Modelos Pedidos sincronizados con la base de datos.');
    })
    .catch((error) => {
        console.error('Error al sincronizar modelos con la base de datos:', error);
    });


module.exports = {
    Administrador,
    Repartidor,
    Preventista,
    Cliente,
    Pedido,
    Cantidad,
    ListaDePrecios,
    Producto,
    LineaPedido,
    Producto_ListaDePrecio,
    Preventista_ListaDePrecio,
    ClienteUsuario,
    AuditoriaRecomendados,
    AuditoriaCambioEstadoPedido,
    AuditoriaListaDePrecios,
    AuditoriaCliente
};