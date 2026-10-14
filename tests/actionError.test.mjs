import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ActionError, errorMessage } from '../lib/actionError.js';

// Simula lo que llega al cliente en producción: mensaje genérico + digest conservado
const asProdClientError = (err) => Object.assign(
  new Error('An error occurred in the Server Components render. The specific message is omitted in production builds to avoid leaking sensitive details.'),
  { digest: err.digest },
);

test('el mensaje de un ActionError sobrevive al saneado de producción', () => {
  const err = new ActionError('Fecha no válida: ñ, tildes y % símbolos', 400);
  assert.equal(err.statusCode, 400);
  assert.equal(errorMessage(asProdClientError(err)), 'Fecha no válida: ñ, tildes y % símbolos');
});

test('un error inesperado saneado usa el texto de respaldo', () => {
  const err = asProdClientError({ digest: '1234567890' });
  assert.equal(errorMessage(err, 'No se pudo guardar'), 'No se pudo guardar');
});

test('en desarrollo (sin sanear) se usa el mensaje tal cual', () => {
  assert.equal(errorMessage(new Error('Detalle'), 'Respaldo'), 'Detalle');
  assert.equal(errorMessage(undefined, 'Respaldo'), 'Respaldo');
  assert.equal(errorMessage('texto'), 'texto');
});
