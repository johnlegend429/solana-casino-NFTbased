module.exports = function (model, io, client) {
	require('./comman/index.js')(model, io, client);
	require('./chat/index.js')(model, io, client);
	require('./roulette/index.js')(model, io, client);
}
