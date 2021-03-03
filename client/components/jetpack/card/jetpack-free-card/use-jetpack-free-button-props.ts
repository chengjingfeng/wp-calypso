/**
 * External dependencies
 */
import { useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';

/**
 * Internal dependencies
 */
import { JPC_PATH_BASE } from 'calypso/jetpack-connect/constants';
import { storePlan } from 'calypso/jetpack-connect/persistence-utils';
import isJetpackCloud from 'calypso/lib/jetpack/is-jetpack-cloud';
import useTrackCallback from 'calypso/lib/jetpack/use-track-callback';
import { PLAN_JETPACK_FREE } from 'calypso/lib/plans/constants';
import { addQueryArgs } from 'calypso/lib/route';
import { getUrlParts, getUrlFromParts } from 'calypso/lib/url';
import getJetpackWpAdminUrl from 'calypso/state/selectors/get-jetpack-wp-admin-url';

/**
 * Type dependencies
 */
import type { QueryArgs } from 'calypso/my-sites/plans/jetpack-plans/types';

type SiteId = number | null;
type Props = {
	href: string;
	onClick: () => void;
};

const buildHref = (
	wpAdminUrl: string | undefined,
	siteId: SiteId,
	urlQueryArgs: QueryArgs
): string => {
	const { site } = urlQueryArgs;

	// If the user is not logged in and there is a site in the URL, we need to construct
	// the URL to wp-admin from the `site` query parameter
	let jetpackAdminUrlFromQuery;

	if ( site ) {
		let wpAdminUrlFromQuery;

		// Ensure that URL is valid
		try {
			// Slugs of secondary sites of a multisites network follow this syntax: example.net::second-site
			wpAdminUrlFromQuery = new URL(
				`https://${ site.replaceAll( '::', '/' ) }/wp-admin/admin.php`
			);
		} catch ( e ) {}

		if ( wpAdminUrlFromQuery ) {
			jetpackAdminUrlFromQuery = getUrlFromParts( {
				...getUrlParts( wpAdminUrlFromQuery.href ),
				search: '?page=jetpack',
				hash: '/my-plan',
			} ).href;
		}
	}

	// `siteId` is going to be null if the user is not logged in, so we need to check
	// if there is a site in the URL also
	const isSiteinContext = siteId || site;

	// Jetpack Connect flow uses `url` instead of `site` as the query parameter for a site URL
	const { site: url, ...restQueryArgs } = urlQueryArgs;

	return isJetpackCloud() && ! isSiteinContext
		? addQueryArgs( { url, ...restQueryArgs }, `https://wordpress.com${ JPC_PATH_BASE }` )
		: wpAdminUrl || jetpackAdminUrlFromQuery || JPC_PATH_BASE;
};

export default function useJetpackFreeButtonProps(
	siteId: SiteId,
	urlQueryArgs: QueryArgs = {}
): Props {
	const wpAdminUrl = useSelector( getJetpackWpAdminUrl );
	const trackCallback = useTrackCallback( undefined, 'calypso_product_jpfree_click', {
		site_id: siteId || undefined,
	} );
	const onClick = useCallback( () => {
		storePlan( PLAN_JETPACK_FREE );
		trackCallback();
	}, [ trackCallback ] );
	const href = useMemo( () => buildHref( wpAdminUrl, siteId, urlQueryArgs ), [
		wpAdminUrl,
		siteId,
		urlQueryArgs,
	] );

	return {
		href,
		onClick,
	};
}
