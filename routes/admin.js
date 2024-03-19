const { check, validationResult } = require( 'express-validator/check' );
module.exports = function ( app, model, controller ) {
    var middleware = require( '../app/middleware/index' )( model );
    var validation = require( '../app/validator/index' )( model );
    app.get( '/backend', middleware.admin.isLogin, controller.login.signin );
    app.post( '/login/check', validation.admin.login, controller.login.signinCheck );
    app.get( '/login/forget', middleware.admin.isLogin, controller.login.forget );
    app.post( '/login/forgetpassword', middleware.admin.isLogin, controller.login.forgetPassword );
    app.get( '/backend/dashboard', middleware.admin.login, controller.dashboard.view );
    app.get( '/backend/logout', middleware.admin.login, controller.login.logout );
    app.get( '/backend/changepassword', middleware.admin.login, controller.login.changePassword );
    app.post( '/backend/changepasswordPost', validation.admin.changePassword, controller.login.changepasswordPost );
    /* Start: User routing */
    app.get( '/backend/user', middleware.admin.login, controller.user.view );
    app.get( '/backend/getUsers', middleware.admin.login, controller.user.getUsers );
    app.get( '/backend/user/edit/:id', middleware.admin.login, controller.user.edit );
    app.post( '/backend/user/updateUser/:id', middleware.admin.login, validation.admin.user, controller.user.update );
    app.get( '/backend/user/ban/:id', middleware.admin.login, controller.user.ban );
    app.get( '/backend/user/unban/:id', middleware.admin.login, controller.user.unban );
    app.get( '/backend/user/moderator/:id', middleware.admin.login, controller.user.moderator );
    app.get( '/backend/user/notmoderator/:id', middleware.admin.login, controller.user.notmoderator );
    app.get( '/backend/user/banchat/:id', middleware.admin.login, controller.user.banchat );
    app.get( '/backend/user/unbanchat/:id', middleware.admin.login, controller.user.unbanchat );
    app.get( '/backend/user/delete/:id', middleware.admin.login, controller.user.delete );
    /* End: User routing */
    /*Start: CMS routing*/
    app.get( '/backend/cms', middleware.admin.login, controller.cms.view );
    app.get( '/backend/getCms', middleware.admin.login, controller.cms.getCms );
    app.get( '/backend/cms/add', middleware.admin.login, controller.cms.add );
    app.post( '/backend/cms/checkDuplicate', middleware.admin.login, controller.cms.checkDuplicate );
    app.post( '/backend/cms/saveCms', middleware.admin.login, validation.admin.cms, controller.cms.save );
    app.get( '/backend/cms/edit/:id', middleware.admin.login, controller.cms.edit );
    app.post( '/backend/cms/updateCms/:id', middleware.admin.login, validation.admin.cms, controller.cms.update );
    app.get( '/backend/cms/delete/:id', middleware.admin.login, controller.cms.delete );
    /*End: CMS routing*/
    /*Start: Roulette routing*/
    app.get( '/backend/roulette', middleware.admin.login, controller.roulette.view );
    app.get( '/backend/getRoulette', middleware.admin.login, controller.roulette.getRoulette );
    app.get( '/backend/roulette/detail/:id', middleware.admin.login, controller.roulette.detail );
    app.get( '/backend/roulette/delete/:id', middleware.admin.login, controller.roulette.delete );
    /*End: Roulette routing*/
    /*Start: Setting routing*/
    app.get( '/backend/setting', middleware.admin.login, controller.setting.view );
    app.post( '/backend/setting/update', middleware.admin.login, controller.setting.update );
    /*End: Setting routing*/
    /*Start: Deposite routing*/
    app.get( '/backend/deposit', middleware.admin.login, controller.deposit.view );
    app.get( '/backend/getDeposit', middleware.admin.login, controller.deposit.getDeposit );
    app.get( '/backend/deposit/delete/:id', middleware.admin.login, controller.deposit.delete );
    /*End: Deposite routing 

    /*Start: Withdraw routing*/
    app.get( '/backend/withdraw', middleware.admin.login, controller.withdraw.view );
    app.get( '/backend/getWithdraw', middleware.admin.login, controller.withdraw.getWithdraw );
    app.get( '/backend/withdraw/delete/:id', middleware.admin.login, controller.withdraw.delete );
    /*End: Withdraw routing*/

    /*Start: Withdraw request routing*/
    app.get( '/backend/withdrawRequest', middleware.admin.login, controller.withdrawRequest.view );
    app.get( '/backend/getWithdrawRequest', middleware.admin.login, controller.withdrawRequest.getWithdrawRequest );
    app.post( '/backend/withdrawRequest/approve/:id', middleware.admin.login, controller.withdrawRequest.approve );
    app.get( '/backend/withdrawRequest/reject/:id', middleware.admin.login, controller.withdrawRequest.reject );
};
