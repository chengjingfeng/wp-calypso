import { isPremium, isBusiness } from '@automattic/calypso-products';
import { FormStatus, useFormStatus } from '@automattic/composite-checkout';
import {
	getCouponLineItemFromCart,
	getCreditsLineItemFromCart,
	isWpComProductRenewal,
	joinClasses,
	NonProductLineItem,
	LineItem,
} from '@automattic/wpcom-checkout';
import styled from '@emotion/styled';
import PropTypes from 'prop-types';
import * as React from 'react';
import { useSelector } from 'react-redux';
import { hasDIFMProduct } from 'calypso/lib/cart-values/cart-items';
import { isMarketplaceProduct } from 'calypso/state/products-list/selectors';
import { ItemVariationPicker } from './item-variation-picker';
import type { OnChangeItemVariant } from './item-variation-picker';
import type { Theme } from '@automattic/composite-checkout';
import type {
	ResponseCart,
	RemoveProductFromCart,
	ResponseCartProduct,
	RemoveCouponFromCart,
} from '@automattic/shopping-cart';

const WPOrderReviewList = styled.ul< { theme?: Theme } >`
	border-top: 1px solid ${ ( props ) => props.theme.colors.borderColorLight };
	box-sizing: border-box;
	margin: 20px 0;
	padding: 0;
`;

const WPOrderReviewListItem = styled.li`
	margin: 0;
	padding: 0;
	display: block;
	list-style: none;
`;

export function WPOrderReviewSection( {
	children,
	className,
}: {
	children: React.ReactNode;
	className?: string;
} ): JSX.Element {
	return <div className={ joinClasses( [ className, 'order-review-section' ] ) }>{ children }</div>;
}

export function WPOrderReviewLineItems( {
	className,
	siteId,
	isSummary,
	removeProductFromCart,
	removeCoupon,
	onChangePlanLength,
	createUserAndSiteBeforeTransaction,
	responseCart,
	isPwpoUser,
	onRemoveProduct,
	onRemoveProductClick,
	onRemoveProductCancel,
}: {
	className?: string;
	siteId?: number | undefined;
	isSummary?: boolean;
	removeProductFromCart?: RemoveProductFromCart;
	removeCoupon: RemoveCouponFromCart;
	onChangePlanLength?: OnChangeItemVariant;
	createUserAndSiteBeforeTransaction?: boolean;
	responseCart: ResponseCart;
	isPwpoUser: boolean;
	onRemoveProduct?: ( label: string ) => void;
	onRemoveProductClick?: ( label: string ) => void;
	onRemoveProductCancel?: ( label: string ) => void;
} ): JSX.Element {
	const creditsLineItem = getCreditsLineItemFromCart( responseCart );
	const couponLineItem = getCouponLineItemFromCart( responseCart );
	const { formStatus } = useFormStatus();
	const isDisabled = formStatus !== FormStatus.READY;
	const hasMarketplaceProduct = useSelector( ( state ) =>
		responseCart.products.some( ( product: ResponseCartProduct ) =>
			isMarketplaceProduct( state, product.product_slug )
		)
	);

	return (
		<WPOrderReviewList className={ joinClasses( [ className, 'order-review-line-items' ] ) }>
			{ responseCart.products.map( ( product ) => {
				const isRenewal = isWpComProductRenewal( product );
				const shouldShowVariantSelector =
					onChangePlanLength &&
					! isRenewal &&
					! isPremiumPlanWithDIFMInTheCart( product, responseCart );
				return (
					<WPOrderReviewListItem key={ product.uuid }>
						<LineItem
							product={ product }
							hasDeleteButton={ canItemBeDeleted( product, responseCart, hasMarketplaceProduct ) }
							removeProductFromCart={ removeProductFromCart }
							isSummary={ isSummary }
							createUserAndSiteBeforeTransaction={ createUserAndSiteBeforeTransaction }
							responseCart={ responseCart }
							isPwpoUser={ isPwpoUser }
							onRemoveProduct={ onRemoveProduct }
							onRemoveProductClick={ onRemoveProductClick }
							onRemoveProductCancel={ onRemoveProductCancel }
						>
							{ shouldShowVariantSelector && (
								<ItemVariationPicker
									selectedItem={ product }
									onChangeItemVariant={ onChangePlanLength }
									isDisabled={ isDisabled }
									siteId={ siteId }
									productSlug={ product.product_slug }
								/>
							) }
						</LineItem>
					</WPOrderReviewListItem>
				);
			} ) }
			{ couponLineItem && (
				<WPOrderReviewListItem key={ couponLineItem.id }>
					<NonProductLineItem
						lineItem={ couponLineItem }
						isSummary={ isSummary }
						hasDeleteButton={ ! isSummary }
						removeProductFromCart={ removeCoupon }
						createUserAndSiteBeforeTransaction={ createUserAndSiteBeforeTransaction }
						isPwpoUser={ isPwpoUser }
					/>
				</WPOrderReviewListItem>
			) }
			{ creditsLineItem && responseCart.sub_total_integer > 0 && (
				<NonProductLineItem
					subtotal
					lineItem={ creditsLineItem }
					isSummary={ isSummary }
					isPwpoUser={ isPwpoUser }
				/>
			) }
		</WPOrderReviewList>
	);
}

WPOrderReviewLineItems.propTypes = {
	className: PropTypes.string,
	siteId: PropTypes.number,
	isSummary: PropTypes.bool,
	removeProductFromCart: PropTypes.func,
	removeCoupon: PropTypes.func,
	onChangePlanLength: PropTypes.func,
	createUserAndSiteBeforeTransaction: PropTypes.bool,
};

/**
 * Checks if the given item is the premium plan product and the DIFM product exists in the provided shopping cart object
 */
function isPremiumPlanWithDIFMInTheCart( item: ResponseCartProduct, responseCart: ResponseCart ) {
	return isPremium( item ) && hasDIFMProduct( responseCart );
}

function canItemBeDeleted(
	item: ResponseCartProduct,
	responseCart: ResponseCart,
	hasMarketplaceProduct: boolean
): boolean {
	const itemTypesThatCannotBeDeleted = [ 'domain_redemption' ];
	if ( itemTypesThatCannotBeDeleted.includes( item.product_slug ) ) {
		return false;
	}

	// The Premium plan cannot be removed from the cart when in combination with the DIFM lite product
	if ( isPremiumPlanWithDIFMInTheCart( item, responseCart ) ) {
		return false;
	}

	// The Business plan cannot be removed from the cart when in combination with a marketplace product
	if ( isBusiness( item ) && hasMarketplaceProduct ) {
		return false;
	}
	return true;
}
