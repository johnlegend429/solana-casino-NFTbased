module.exports = function ( model ) {
    var module = {};

    module.login = async function ( req, res, next ) {
        if ( req.session.user ) {
            var userDetail = await model.User.findByPk( req.session.user.id );
            userDetail.main_balance = parseFloat( userDetail.main_balance );
            req.session.user = userDetail;
            var settingDetail = await model.Setting.findByPk( 1 );
            res.locals.adminSetChips = settingDetail.dataValues.chips;
            next();
        } else {
            req.flash( 'error', "Please log in to Play" );
            res.redirect( '/' );
        }
    };

    module.isLogin = async function ( req, res, next ) {
        if ( req.session.user ) {
            var userDetail = await model.User.findByPk( req.session.user.id );
            userDetail.main_balance = parseFloat( userDetail.main_balance );
            req.session.user = userDetail;
            var settingDetail = await model.Setting.findByPk( 1 );
            res.locals.adminSetChips = settingDetail.dataValues.chips;
            req.flash( 'error', "You have already login." );
            res.redirect( '/' );
        } else {
            next();
        }
    };

    return module;
};    