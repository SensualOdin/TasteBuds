import { useMatchHistory, usePendingInvites, useRespondToInvite } from '@hooks';
import { useSessionStore } from '@state';
import { useAppTheme } from '@theme';
import { AppText, Button, Surface } from '@ui';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ActivityScreen() {
  const { theme } = useAppTheme();
  const { colors, spacing } = theme;
  const user = useSessionStore((state) => state.user);
  const { data: invites = [], isLoading: invitesLoading } = usePendingInvites(user?.email ?? undefined);
  const { mutate: respondToInvite, isPending: inviteMutationPending } = useRespondToInvite(user?.email ?? undefined);
  const { data: matchHistory = [], isLoading: matchHistoryLoading } = useMatchHistory(user?.id ?? undefined);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}> 
      <ScrollView contentContainerStyle={[styles.content, { padding: spacing.lg, gap: spacing.lg }]}> 
        <View style={{ gap: spacing.md }}>
          <AppText variant="headline">Pending Invitations</AppText>
          {invitesLoading ? (
            <Surface variant="muted" padding="lg" radius="xl" style={styles.emptyState}>
              <AppText align="center">Loading invitations…</AppText>
            </Surface>
          ) : invites.length ? (
            invites.map((invite) => (
              <Surface key={invite.id} variant="default" padding="lg" radius="xl" style={{ gap: spacing.sm }}>
                <AppText variant="title">Group Invite</AppText>
                <AppText tone="secondary">Invited by: {invite.inviter_id}</AppText>
                <AppText tone="muted">Status: {invite.status}</AppText>
                <View style={styles.inviteActions}>
                  <Button
                    label="Accept"
                    variant="primary"
                    size="sm"
                    onPress={() => respondToInvite({ inviteId: invite.id, accept: true })}
                    disabled={inviteMutationPending}
                  />
                  <Button
                    label="Decline"
                    variant="outline"
                    size="sm"
                    onPress={() => respondToInvite({ inviteId: invite.id, accept: false })}
                    disabled={inviteMutationPending}
                  />
                </View>
              </Surface>
            ))
          ) : (
            <Surface variant="muted" padding="lg" radius="xl" style={styles.emptyState}>
              <AppText tone="secondary" align="center">
                You have no pending invites right now. When friends invite you, they will show up here.
              </AppText>
            </Surface>
          )}
        </View>

        <View style={{ gap: spacing.md }}>
          <AppText variant="headline">Recent Matches</AppText>
          {matchHistoryLoading ? (
            <Surface variant="muted" padding="lg" radius="xl" style={styles.emptyState}>
              <AppText align="center">Loading match history…</AppText>
            </Surface>
          ) : matchHistory.length ? (
            matchHistory.map((match) => (
              <Surface key={match.id} variant="default" padding="lg" radius="xl" style={{ gap: spacing.sm }}>
                <AppText variant="title">{match.restaurants.name}</AppText>
                <AppText tone="secondary">Matched on {new Date(match.matched_at).toLocaleDateString()}</AppText>
                <Button label="View Details" variant="outline" />
              </Surface>
            ))
          ) : (
            <Surface variant="muted" padding="lg" radius="xl" style={styles.emptyState}>
              <AppText tone="secondary" align="center">
                Swipe with your groups to build up your match history.
              </AppText>
              <Button label="Browse Matches" variant="outline" style={{ marginTop: spacing.lg }} />
            </Surface>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
  },
  emptyState: {
    alignItems: 'center',
    gap: 12,
  },
  inviteActions: {
    flexDirection: 'row',
    gap: 12,
  },
});
