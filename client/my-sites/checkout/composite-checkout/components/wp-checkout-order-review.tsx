import {
	isDomainMapping,
	isDomainRegistration,
	isDomainTransfer,
} from '@automattic/calypso-products';
import { FormStatus, useFormStatus } from '@automattic/composite-checkout';
import { ExperimentAssignment } from '@automattic/explat-client';
import { useShoppingCart } from '@automattic/shopping-cart';
import { styled, joinClasses } from '@automattic/wpcom-checkout';
import { useViewportMatch } from '@wordpress/compose';
import { useTranslate } from 'i18n-calypso';
import PropTypes from 'prop-types';
import { useState, useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { hasP2PlusPlan } from 'calypso/lib/cart-values/cart-items';
import { loadExperimentAssignment } from 'calypso/lib/explat';
import useCartKey from 'calypso/my-sites/checkout/use-cart-key';
import { recordTracksEvent } from 'calypso/state/analytics/actions';
import { NON_PRIMARY_DOMAINS_TO_FREE_USERS } from 'calypso/state/current-user/constants';
import { currentUserHasFlag, getCurrentUser } from 'calypso/state/current-user/selectors';
import getSelectedSite from 'calypso/state/ui/selectors/get-selected-site';
import Coupon from './coupon';
import { WPOrderReviewLineItems, WPOrderReviewSection } from './wp-order-review-line-items';
import type { CouponFieldStateProps } from '../hooks/use-coupon-field-state';
import type { OnChangeItemVariant } from './item-variation-picker';
import type { RemoveProductFromCart, CouponStatus } from '@automattic/shopping-cart';

const SiteSummary = styled.div`
	color: ${ ( props ) => props.theme.colors.textColorLight };
	font-size: 14px;
	margin-top: -10px;
	word-break: break-word;

	.is-summary & {
		margin-bottom: 10px;
	}
`;

const CouponLinkWrapper = styled.div`
	font-size: 14px;
	margin: 10px 0 20px;

	.is-summary & {
		margin-bottom: 0;
	}
`;

const CouponField = styled( Coupon )`
	margin: 20px 30px 20px 0;

	.rtl & {
		margin: 20px 0 20px 30px;
	}

	.is-summary & {
		margin: 10px 0 0;
	}
`;

const CouponEnableButton = styled.button`
	cursor: pointer;
	text-decoration: underline;
	color: ${ ( props ) => props.theme.colors.highlight };
	font-size: 14px;

	:hover {
		text-decoration: none;
	}
`;

const GeneratedNameNote = styled.p`
	font-size: 0.75rem;
	font-style: italic;
	margin-top: 4px;
`;

export default function WPCheckoutOrderReview( {
	className,
	removeProductFromCart,
	couponFieldStateProps,
	onChangePlanLength,
	siteUrl,
	siteId,
	isSummary,
	createUserAndSiteBeforeTransaction,
}: {
	className?: string;
	removeProductFromCart?: RemoveProductFromCart;
	couponFieldStateProps: CouponFieldStateProps;
	onChangePlanLength?: OnChangeItemVariant;
	siteUrl?: string;
	siteId?: number | undefined;
	isSummary?: boolean;
	createUserAndSiteBeforeTransaction?: boolean;
} ): JSX.Element {
	const translate = useTranslate();
	const [ isCouponFieldVisible, setCouponFieldVisible ] = useState( false );
	const [ experiment, setExperiment ] = useState< ExperimentAssignment | null >( null );
	const cartKey = useCartKey();
	const { responseCart, removeCoupon, couponStatus } = useShoppingCart( cartKey );
	const isPurchaseFree = responseCart.total_cost_integer === 0;
	const isDesktop = useViewportMatch( 'mobile', '>=' );
	const reduxDispatch = useDispatch();

	useEffect( () => {
		const experimentCheck = isDesktop
			? 'registration_email_only_desktop_random_usernames'
			: 'registration_email_only_mobile_random_usernames';
		let shouldCheck = true;
		loadExperimentAssignment( experimentCheck ).then( ( experimentObject ) => {
			if ( shouldCheck ) {
				setExperiment( experimentObject );
			}
		} );
		return () => {
			shouldCheck = false;
		};
	}, [ isDesktop ] );

	const onRemoveProductCancel = useCallback( () => {
		reduxDispatch( recordTracksEvent( 'calypso_checkout_composite_cancel_delete_product' ) );
	}, [ reduxDispatch ] );
	const onRemoveProduct = useCallback(
		( label: string ) => {
			reduxDispatch(
				recordTracksEvent( 'calypso_checkout_composite_delete_product', {
					product_name: label,
				} )
			);
		},
		[ reduxDispatch ]
	);
	const onRemoveProductClick = useCallback(
		( label: string ) => {
			reduxDispatch(
				recordTracksEvent( 'calypso_checkout_composite_delete_product_press', {
					product_name: label,
				} )
			);
		},
		[ reduxDispatch ]
	);

	const selectedSiteData = useSelector( getSelectedSite );

	const primaryDomain = selectedSiteData?.options?.is_mapped_domain
		? selectedSiteData?.domain
		: null;
	const firstDomainProduct = responseCart.products.find(
		( product ) =>
			isDomainTransfer( product ) || isDomainRegistration( product ) || isDomainMapping( product )
	);
	const domainUrl = primaryDomain ?? firstDomainProduct?.meta ?? siteUrl;

	const removeCouponAndClearField = () => {
		couponFieldStateProps.setCouponFieldValue( '' );
		setCouponFieldVisible( false );
		return removeCoupon();
	};

	const planIsP2Plus = hasP2PlusPlan( responseCart );
	const shouldShowDomainNote = experiment?.variationName && domainUrl?.includes( 'wordpress.com' );
	const isPwpoUser = useSelector(
		( state ) =>
			getCurrentUser( state ) && currentUserHasFlag( state, NON_PRIMARY_DOMAINS_TO_FREE_USERS )
	);

	return (
		<div
			className={ joinClasses( [ className, 'checkout-review-order', isSummary && 'is-summary' ] ) }
		>
			{ ! planIsP2Plus && domainUrl && 'no-user' !== domainUrl && (
				<SiteSummary>
					{ translate( 'Site: %s', { args: domainUrl } ) }
					{ shouldShowDomainNote && (
						<GeneratedNameNote>
							{ translate( 'You can change this name at any time in your account settings.' ) }
						</GeneratedNameNote>
					) }
				</SiteSummary>
			) }
			{ planIsP2Plus && selectedSiteData?.name && (
				<SiteSummary>
					{ translate( 'Upgrade: {{strong}}%s{{/strong}}', {
						args: selectedSiteData.name,
						components: {
							strong: <strong />,
						},
					} ) }
				</SiteSummary>
			) }

			<WPOrderReviewSection>
				<WPOrderReviewLineItems
					siteId={ siteId }
					removeProductFromCart={ removeProductFromCart }
					removeCoupon={ removeCouponAndClearField }
					onChangePlanLength={ onChangePlanLength }
					isSummary={ isSummary }
					createUserAndSiteBeforeTransaction={ createUserAndSiteBeforeTransaction }
					responseCart={ responseCart }
					isPwpoUser={ isPwpoUser ?? false }
					onRemoveProduct={ onRemoveProduct }
					onRemoveProductClick={ onRemoveProductClick }
					onRemoveProductCancel={ onRemoveProductCancel }
				/>
			</WPOrderReviewSection>

			<CouponFieldArea
				isCouponFieldVisible={ isCouponFieldVisible }
				setCouponFieldVisible={ setCouponFieldVisible }
				isPurchaseFree={ isPurchaseFree }
				couponStatus={ couponStatus }
				couponFieldStateProps={ couponFieldStateProps }
			/>
		</div>
	);
}

WPCheckoutOrderReview.propTypes = {
	isSummary: PropTypes.bool,
	className: PropTypes.string,
	removeProductFromCart: PropTypes.func,
	onChangePlanLength: PropTypes.func,
	siteUrl: PropTypes.string,
	couponFieldStateProps: PropTypes.object.isRequired,
};

function CouponFieldArea( {
	isCouponFieldVisible,
	setCouponFieldVisible,
	isPurchaseFree,
	couponStatus,
	couponFieldStateProps,
}: {
	isCouponFieldVisible: boolean;
	setCouponFieldVisible: ( visible: boolean ) => void;
	isPurchaseFree: boolean;
	couponStatus: CouponStatus;
	couponFieldStateProps: CouponFieldStateProps;
} ) {
	const { formStatus } = useFormStatus();
	const translate = useTranslate();
	const { setCouponFieldValue } = couponFieldStateProps;

	useEffect( () => {
		if ( couponStatus === 'applied' ) {
			// Clear the field value when the coupon is applied
			setCouponFieldValue( '' );
		}
	}, [ couponStatus, setCouponFieldValue ] );

	if ( isPurchaseFree || couponStatus === 'applied' ) {
		return null;
	}

	if ( isCouponFieldVisible ) {
		return (
			<CouponField
				id="order-review-coupon"
				disabled={ formStatus !== FormStatus.READY }
				couponStatus={ couponStatus }
				couponFieldStateProps={ couponFieldStateProps }
			/>
		);
	}

	return (
		<CouponLinkWrapper>
			{ translate( 'Have a coupon? ' ) }
			<CouponEnableButton
				className="wp-checkout-order-review__show-coupon-field-button"
				onClick={ () => setCouponFieldVisible( true ) }
			>
				{ translate( 'Add a coupon code' ) }
			</CouponEnableButton>
		</CouponLinkWrapper>
	);
}
