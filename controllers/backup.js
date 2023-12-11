const { Connection, Request } = require('tedious');
const fs = require('fs');

const backupDatabase = async (req, res) => {
  try {
    
    const config = {
      authentication: {
        options: {
          userName: process.env.DB_USERNAME,
          password: process.env.DB_PASSWORD,
        },
        type: 'default',
      },
      server: process.env.DB_HOST,
      options: {
        database: process.env.DB_NAME,
        encrypt: true,
        trustServerCertificate: true,
      },
    };

    const connection = new Connection(config);

    const backupFilePath = 'C:\\Program Files\\Microsoft SQL Server\\MSSQL16.SQLEXPRESS\\MSSQL\\Backup\\preventapp.bak';

    connection.on('connect', (err) => {
      if (err) {
        console.error('Error al conectar:', err);
        res.status(500).json({ error: 'Error al conectar a la base de datos' });
      } else {
        console.log('Conexión establecida.');

        executeBackup(res, connection, backupFilePath);
      }
    });

    connection.on('error', (err) => {
      console.error('Error de conexión:', err);
      res.status(500).json({ error: 'Error de conexión a la base de datos' });
    });

    connection.connect();
  } catch (error) {
    console.error('Error al realizar el respaldo:', error);
    res.status(500).json({ error: 'Error al realizar el respaldo' });
  }
};

const executeBackup = (res, connection, backupFilePath) => {
  const query = `BACKUP DATABASE ${process.env.DB_NAME} TO DISK = '${backupFilePath}' WITH FORMAT;`;

  const request = new Request(query, (err) => {
    if (err) {
      console.error('Error al ejecutar el respaldo:', err);
      res.status(500).json({ error: 'Error al ejecutar el respaldo' });
    } else {
      console.log('Respaldo completado con éxito.');

      connection.close();
      
      res.json({ message: 'Respaldo completado con éxito' });
    }
  });

  connection.execSql(request);
};

module.exports = {
  backupDatabase,
};
