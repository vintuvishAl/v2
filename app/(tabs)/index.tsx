import ChatView from '@/components/ChatView';
import { PropsWithChildren } from 'react';
import { ThemedText } from '../../components/ThemedText';

export const CustomText = ({ children }: PropsWithChildren) => <ThemedText>{children}</ThemedText>;

export default function HomeScreen() {
  return <ChatView userName="vishal" />;
}
