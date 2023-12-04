const { Sequelize, DataTypes } = require('sequelize');
const { db } = require('../database/connection');

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

const Pedido = db.define('Pedido', {
    idPedido: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    nota: {
        type: DataTypes.TEXT,
    },
    preventista_email: {
        type: DataTypes.STRING,
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
    },
    idPedido: {
        type: DataTypes.INTEGER,
        primaryKey: true,
    },
    idCliente: {
        type: DataTypes.INTEGER,
    },
    nota: {
        type: DataTypes.TEXT,
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
    Preventista_ListaDePrecio
};