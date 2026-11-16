import { StyleSheet } from 'react-native';
import { borderRadius, fonts, spacing } from '../../../theme';

export const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    padding: spacing.xl,
    gap: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconBadge: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextWrap: {
    flex: 1,
  },
  title: {
    fontSize: 17,
    fontFamily: fonts.bold,
  },
  subtitle: {
    fontSize: 12,
    fontFamily: fonts.regular,
    marginTop: 2,
  },
  dobBox: {
    borderRadius: borderRadius.md,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dobLabel: {
    fontSize: 13,
    fontFamily: fonts.medium,
  },
  dobValue: {
    fontSize: 13,
    fontFamily: fonts.semibold,
  },
  termsWrap: {
    borderRadius: borderRadius.md,
    borderWidth: 1,
    maxHeight: 165,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  termsScroll: {
    flexGrow: 0,
  },
  termBlock: {
    marginBottom: spacing.sm,
  },
  termTitle: {
    fontSize: 12,
    fontFamily: fonts.semibold,
    marginBottom: 2,
  },
  termBody: {
    fontSize: 12,
    fontFamily: fonts.regular,
    lineHeight: 17,
  },
  warningBox: {
    borderRadius: borderRadius.md,
    borderWidth: 1,
    padding: spacing.md,
  },
  warningText: {
    fontSize: 13,
    fontFamily: fonts.medium,
    lineHeight: 19,
  },
  checkBoxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    padding: spacing.md,
  },
  box: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  consentText: {
    flex: 1,
    fontSize: 13,
    fontFamily: fonts.regular,
    lineHeight: 19,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  strong: { fontFamily: fonts.semibold },
  btn: { flex: 1 },
});
