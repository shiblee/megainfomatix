const { checkConnection } = require('../config/db');
const pythonService = require('../services/pythonService');
const { sendSuccess } = require('../utils/response');

const getHealth = async (req, res) => {
  const database = await checkConnection().then(
    () => 'ok',
    () => 'unreachable',
  );
  const python = await pythonService.checkHealth();

  const healthy = database === 'ok';
  return sendSuccess(
    res,
    { status: healthy ? 'ok' : 'degraded', database, python, uptime: Math.round(process.uptime()) },
    { message: healthy ? 'Server is healthy' : 'Server is degraded', statusCode: healthy ? 200 : 503 },
  );
};

module.exports = { getHealth };
