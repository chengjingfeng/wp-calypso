import { useTranslate } from 'i18n-calypso';
import Count from 'calypso/components/count';
import { useEmailAccountsQuery } from 'calypso/data/emails/use-emails-query';
import { type as domainType } from 'calypso/lib/domains/constants';
import { getEmailAddress } from 'calypso/lib/emails';
import { emailManagement } from 'calypso/my-sites/email/paths';
import DomainInfoCard from '..';
import type { DomainInfoCardProps } from '../types';
import type { EmailAccount } from './types';

const DomainEmailInfoCard = ( {
	domain,
	selectedSite,
}: DomainInfoCardProps ): JSX.Element | null => {
	const translate = useTranslate();
	const { data, error, isLoading } = useEmailAccountsQuery( selectedSite.ID, domain.name );

	let emailAddresses: string[] = [];

	if ( domain.type === domainType.TRANSFER ) return null;

	if ( ! isLoading && ! error ) {
		const emailAccounts: EmailAccount[] = data?.accounts;

		if ( emailAccounts.length ) {
			emailAddresses = emailAccounts
				.map( ( a ) => a.emails )
				.flat()
				.map( getEmailAddress )
				.filter( ( email ) => email );
		}
	}

	return ! emailAddresses.length ? (
		<DomainInfoCard
			type="href"
			href={ emailManagement( selectedSite.slug, domain.name ) }
			title={ translate( 'Email' ) }
			description={ translate( 'Send and receive emails from youremail@%(domainName)s', {
				args: { domainName: domain.name },
			} ) }
			ctaText={ translate( 'Add professional email' ) }
			isPrimary={ true }
		/>
	) : (
		<DomainInfoCard
			type="href"
			href={ emailManagement( selectedSite.slug, domain.name ) }
			title={
				<>
					{ translate( 'Email' ) }
					<Count count={ emailAddresses.length }></Count>
				</>
			}
			description={ emailAddresses.join( '\n' ) }
			ctaText={ translate( 'View emails' ) }
		/>
	);
};

export default DomainEmailInfoCard;
