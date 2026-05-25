import * as Linking from 'expo-linking';
import { Share } from 'react-native';

export function generateInviteLink(groupId: string): string {
  return Linking.createURL(`group/join/${groupId}`);
}

export async function shareInviteLink(groupName: string, groupId: string): Promise<void> {
  const link = generateInviteLink(groupId);
  await Share.share({
    message: `Bạn được mời tham gia nhóm "${groupName}" trên Vén!\n${link}`,
  });
}
