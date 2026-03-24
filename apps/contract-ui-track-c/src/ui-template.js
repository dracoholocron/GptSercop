const { statusClass } = require('./ui-components');
const { appStyles, appShellMarkup } = require('./ui-layout');
const { clientScript } = require('./ui-behaviors');
const { getUiConfig } = require('./ui-config');

function htmlPage({ initialRoute = '/app/dashboard', locale } = {}) {
  const uiConfig = getUiConfig(locale);
  return `<!doctype html><html lang="${uiConfig.locale}"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><title>SERCOP · Compras Públicas</title><style>${appStyles()}</style></head><body>${appShellMarkup(uiConfig.i18n)}<script>${clientScript(initialRoute, uiConfig)}</script></body></html>`;
}

module.exports = { htmlPage, statusClass };
