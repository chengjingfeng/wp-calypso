import { BackButton, NextButton, SubTitle, Title } from '@automattic/onboarding';
import { useI18n } from '@wordpress/react-i18n';
import page from 'page';
import React from 'react';
import { getStepUrl } from 'calypso/signup/utils';
import { GoToStep } from '../../../import/types';

import './style.scss';

/* eslint-disable wpcalypso/jsx-classname-namespace */

interface Props {
	goToStep: GoToStep;
	siteSlug: string;
}

const NotAuthorized: React.FunctionComponent< Props > = ( props ) => {
	const { __ } = useI18n();
	const { goToStep, siteSlug } = props;

	/**
	 ↓ Methods
	 */
	const backToStart = (): void => {
		page( getStepUrl( 'importer', 'capture', '', '', { siteSlug } ) );
	};

	return (
		<div className="import-layout__center">
			<div className="import__header">
				<div className="import__heading  import__heading-center">
					<Title>{ __( 'Your are not authorized to import content' ) }</Title>
					<SubTitle>{ __( 'Please check with your site admin.' ) }</SubTitle>

					<div className="import__buttons-group">
						<NextButton onClick={ () => goToStep( 'intent', '', 'setup-site' ) }>
							{ __( 'Start building' ) }
						</NextButton>
						<div>
							<BackButton onClick={ backToStart }>{ __( 'Back to start' ) }</BackButton>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default NotAuthorized;
