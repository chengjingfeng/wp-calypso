/** @format */
/**
 * External dependencies
 */
import page from 'page';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { localize } from 'i18n-calypso';

/**
 * Internal dependencies
 */
import Button from 'components/button';
import Card from 'components/card';
import config from 'config';
import BackButton from 'components/back-button';
import { recordTracksEvent } from 'state/analytics/actions';

class JetpackNewSite extends Component {
	constructor() {
		super();
		this.handleOnClickTos = this.handleOnClickTos.bind( this );
		this.handleBack = this.handleBack.bind( this );
	}

	state = { jetpackUrl: '' };

	componentDidMount() {
		this.props.recordTracksEvent( 'calypso_jetpack_new_site_view' );
	}

	handleJetpackUrlChange = event => this.setState( { jetpackUrl: event.target.value } );

	getNewWpcomSiteUrl() {
		return config( 'signup_url' ) + '?ref=calypso-selector';
	}

	handleJetpackSubmit = () => {
		this.props.recordTracksEvent( 'calypso_jetpack_new_site_connect_click' );
		page( '/jetpack/connect?url=' + this.state.jetpackUrl );
	};

	handleOnClickTos() {
		this.props.recordTracksEvent( 'calypso_jpc_tos_link_click' );
	}

	handleBack( event ) {
		event.preventDefault();
		this.props.recordTracksEvent( 'calypso_jetpack_new_site_back' );
		page.back();
	}

	render() {
		return (
			<div>
				<BackButton onClick={ this.handleBack } />
				<div className="jetpack-new-site__main jetpack-new-site">
					<header className="formatted-header">
						<h1 className="formatted-header__title">
							{ this.props.translate( 'Add a New Site' ) }
						</h1>
						<p className="formatted-header__subtitle">
							{ this.props.translate(
								'Create a new site or add your existing self-hosted site.'
							) }{' '}
						</p>
					</header>
					<div className="jetpack-new-site__content">
						<Card className="jetpack-new-site__card">
							<div className="jetpack-new-site__card-description">
								<p>
									{ this.props.translate(
										'Create a shiny new WordPress.com site.'
									) }
								</p>
							</div>
							<Button
								className="jetpack-new-site__button button is-primary"
								href={ this.getNewWpcomSiteUrl() }
							>
								{ this.props.translate( 'Create a new site' ) }
							</Button>

							<div className="jetpack-new-site__divider">
								<span>{ this.props.translate( 'or' ) }</span>
							</div>

							<div className="jetpack-new-site__card-description">
								<p>
									{ this.props.translate(
										'If you already have a WordPress site hosted somewhere else, we can add it for you now.'
									) }
								</p>
							</div>
							<Button
								className="jetpack-new-site__connect-button button is-primary"
								onClick={ this.handleJetpackSubmit }
							>
								{ this.props.translate( 'Add existing site' ) }
							</Button>
						</Card>
					</div>
				</div>
			</div>
		);
	}
}

export default connect( null, { recordTracksEvent } )( localize( JetpackNewSite ) );
