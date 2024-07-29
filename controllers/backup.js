const { Connection, Request } = require('tedious');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

const backupDatabase = async (req, res) => {
  try {
    const backupFilePath = path.join('/tmp/backups', 'preventapp.sql');

    const command = `mysqldump -u ${process.env.DB_USERNAME} -p${process.env.DB_PASSWORD} -h ${process.env.DB_HOST} ${process.env.DB_NAME} > ${backupFilePath}`;

    // Ejecutar el comando
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error('Error al ejecutar el respaldo:', error);
        res.status(500).json({ error: 'Error al ejecutar el respaldo' });
      } else {
        console.log('Respaldo completado con éxito.');
        res.json({ message: 'Respaldo completado con éxito' });
      }
    });
  } catch (error) {
    console.error('Error al realizar el respaldo:', error);
    res.status(500).json({ error: 'Error al realizar el respaldo' });
  }
};

const restoreDatabase = async (req, res) => {
  try {
    // Ruta del archivo de respaldo
    const backupFilePath = path.join('/tmp/backups', 'preventapp.sql');

    // Comando para restaurar la base de datos
    const command = `mysql -u ${process.env.DB_USERNAME} -p${process.env.DB_PASSWORD} -h ${process.env.DB_HOST} ${process.env.DB_NAME} < ${backupFilePath}`;

    // Ejecutar el comando
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error('Error al ejecutar la restauración:', error);
        res.status(500).json({ error: 'Error al ejecutar la restauración' });
      } else {
        console.log('Restauración completada con éxito.');
        res.status(200).json({ message: 'Restauración completada con éxito' });
      }
    });
  } catch (error) {
    console.error('Error al realizar la restauración:', error);
    res.status(500).json({ error: 'Error al realizar la restauración' });
  }
};

module.exports = {
  backupDatabase,
  restoreDatabase
};
