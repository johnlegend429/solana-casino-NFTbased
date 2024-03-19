var currentDate = new Date();
var Op = Sequelize.Op;

module.exports = function ( model, config ) {
	var module = {};

	module.view = function ( request, response ) {
		response.render( 'backend/cms/cms', {
			title: 'CMS List',
			error: request.flash( "error" ),
			success: request.flash( "success" ),
			vErrors: request.flash( "vErrors" ),
			auth: request.session,
			config: config,
			alias: 'cms',
			subAlias: 'list',
		} );
	};

	module.getCms = async function ( request, response ) {

		var start = parseInt( request.query.start );
		var length = parseInt( request.query.length );
		var search = request.query.search.value;
		var query = { "is_deleted": "0" };
		if ( search != '' ) {
			query = {
				[ Op.or ]: [
					{ 'title': { [ Op.like ]: '%' + search + '%' } },
					{ 'meta_tag': { [ Op.like ]: '%' + search + '%' } },
					{ 'meta_title': { [ Op.like ]: '%' + search + '%' } }
				], "is_deleted": "0"
			};
		}

		var cmsCount = await model.Cms.count( { where: query } );
		var cmses = await model.Cms.findAll( { where: query, order: [ [ 'id', 'desc' ] ], offset: start, limit: length, raw: true } );

		for ( var i = 0; i < cmses.length; i++ ) {
			cmses[ i ].editDel = '<a href="/backend/cms/edit/' + cmses[ i ].id + '" class="btn btn-primary btn-sm" title="Edit CMS"><i class="fa fa-edit"></i></a><a style="margin-left:5px;" href="/backend/cms/delete/' + cmses[ i ].id + '" onClick="return confirm(\'Are you sure to delete?\')" class="btn btn-danger btn-sm" title="Delete CMS"><i class="glyphicon glyphicon-trash"></i></a>';
		}

		var obj = {
			'draw': request.query.draw,
			'recordsTotal': cmsCount,
			'recordsFiltered': cmsCount,
			'data': cmses
		};

		return response.send( JSON.stringify( obj ) );
	};

	module.add = function ( request, response ) {

		response.render( 'backend/cms/add', {
			title: 'Add CMS',
			error: request.flash( "error" ),
			success: request.flash( "success" ),
			vErrors: request.flash( "vErrors" ),
			auth: request.session,
			config: config,
			alias: 'cms',
			subAlias: 'add',
		} );
	};

	module.save = async function ( request, response ) {

		var inputData = {
			title: request.body.title,
			description: request.body.description,
			meta_tag: request.body.meta_tag,
			meta_title: request.body.meta_title,
			meta_description: request.body.meta_description,
			type: request.body.cms_type,
		};
		try {

			var cmsData = await model.Cms.create( inputData );
			if ( cmsData != null ) {
				request.flash( 'success', "CMS add successfully" );
				response.redirect( '/backend/cms' );
			} else {
				request.flash( 'error', "CMS detail not save." );
				response.redirect( '/backend/cms' );
			}

		} catch ( err ) {
			request.flash( 'error', "CMS detail not save." );
			response.redirect( '/backend/cms' );
		}
	};

	module.checkDuplicate = async function ( request, response ) {
		var title = request.body.title;
		let condition = { title: title, is_deleted: "0" };
		if ( request.body.id ) {
			condition.id = { [ Op.ne ]: request.body.id };
		}
		var cmsDetail = await model.Cms.findOne( { where: condition } );

		if ( cmsDetail ) {
			response.send( "false" );
		} else {
			response.send( "true" );
		}
	};

	module.edit = async function ( request, response ) {
		var cmsId = request.params.id;
		if ( cmsId != "" && cmsId != 0 ) {
			try {
				var cmsDetail = await model.Cms.findByPk( cmsId );
				if ( cmsDetail != null ) {
					response.render( 'backend/cms/edit', {
						title: 'Edit CMS',
						error: request.flash( "error" ),
						success: request.flash( "success" ),
						vErrors: request.flash( "vErrors" ),
						auth: request.session,
						config: config,
						cms: cmsDetail,
						alias: 'cms',
						subAlias: 'add',
					} );
				} else {
					request.flash( 'error', "CMS detail not available." );
					response.redirect( '/backend/cms' );
				}
			} catch ( err ) {
				request.flash( 'error', "CMS detail not available." );
				response.redirect( '/backend/cms' );
			}
		} else {
			request.flash( 'error', "CMS detail not available." );
			response.redirect( '/backend/cms' );
		}
	};

	module.update = async function ( request, response ) {
		var cmsId = request.params.id;
		if ( cmsId != "" && cmsId != 0 ) {
			try {
				var cmsData = await model.Cms.findByPk( cmsId );
				if ( cmsData != null ) {

					var inputData = {
						title: request.body.title,
						description: request.body.description,
						meta_tag: request.body.meta_tag,
						meta_title: request.body.meta_title,
						meta_description: request.body.meta_description,
						type: request.body.cms_type,
					};

					var update_data = await cmsData.update( inputData );
					request.flash( 'success', "CMS detail update successfully." );
					response.redirect( '/backend/cms' );
				} else {
					request.flash( 'error', "CMS detail not update." );
					response.redirect( '/backend/cms' );
				}
			} catch ( err ) {
				request.flash( 'error', "CMS detail not update." );
				response.redirect( '/backend/cms' );
			}
		} else {
			request.flash( 'error', "CMS detail not update." );
			response.redirect( '/backend/cms' );
		}
	};

	module.delete = async function ( request, response ) {
		var cmsId = request.params.id;
		if ( cmsId != "" && cmsId != 0 ) {
			try {
				var cmsData = await model.Cms.update( { "is_deleted": "1", "status": "inactive" }, { where: { id: cmsId } } );
				request.flash( 'success', "CMS delete successfully." );
				response.redirect( '/backend/cms' );
			} catch ( err ) {
				console.log( "delete error: ", err );
				request.flash( 'error', "CMS not delete." );
				response.redirect( '/backend/cms' );
			}
		} else {
			request.flash( 'error', "CMS not delete." );
			response.redirect( '/backend/cms' );
		}
	};

	return module;
};

function randomNumber ( length ) {
	var chars = '0123456789';
	var result = '';
	for ( var i = length; i > 0; --i ) result += chars[ Math.floor( Math.random() * chars.length ) ];
	return result;
}