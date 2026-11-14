/**
 * Generic controller factory for endpoints backed by the Python layer.
 * Used by the monitoring, analysis and reports modules.
 */
const pythonService = require('../services/pythonService');
const { sendSuccess } = require('../utils/response');

const forward =
  (operation, { message = 'Success', statusCode = 200 } = {}) =>
  async (req, res) => {
    const data = await pythonService.call(operation);
    return sendSuccess(res, data, { message, statusCode });
  };

module.exports = { forward };
