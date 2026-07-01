import { redirect } from 'next/navigation';

export default function CommunitySearchRedirectPage() {
  redirect('/community?focus=search');
}
