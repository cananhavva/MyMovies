import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fontSize, spacing } from '@/config/theme';
import { COLORS } from '@/domain/colors';
import { SUBCATEGORIES } from '@/domain/subcategories';
import { CATEGORIES, FORMALITY_LEVELS, OCCASIONS, PATTERNS, SEASONS, WARMTH_LEVELS, WEATHERS } from '@/domain/taxonomy';
import type { FiberPart, TaggableField } from '@/domain/types';
import { appError } from '@/errors/AppError';
import { colorLabel, subcategoryLabel } from '@/i18n/labels';
import { parseComposition } from '@/rules/compositionParser';
import { assessQuality, editDraft, withComposition, type GarmentDraft } from '@/services/garmentDraft';
import { Button } from './Button';
import { ChipGroup } from './ChipGroup';
import { ErrorBanner } from './ErrorBanner';
import { Notice } from './Notice';
import { PhotoStrip } from './PhotoStrip';
import { QualityBadge } from './QualityBadge';
import { SectionTitle } from './SectionTitle';
import { TextField } from './TextField';

interface GarmentFormProps {
  draft: GarmentDraft;
  onChange: (draft: GarmentDraft) => void;
  onAddPhoto: () => void;
  onLabelPhoto: () => void;
  nameError?: string;
}

function formatComposition(parts: readonly FiberPart[] | undefined): string {
  return (parts ?? []).map((p) => `${p.percent}% ${p.fiber}`).join(' ');
}

export function GarmentForm({ draft, onChange, onAddPhoto, onLabelPhoto, nameError }: GarmentFormProps) {
  const { t } = useTranslation();
  const [fabricText, setFabricText] = useState(() => formatComposition(draft.composition));
  const [fabricParts, setFabricParts] = useState<FiberPart[] | undefined>();

  // A label photo can fill the composition from outside the form; keep the text field in sync.
  useEffect(() => setFabricText(formatComposition(draft.composition)), [draft.composition]);

  const isAi = (field: TaggableField) => draft.fieldSources[field] === 'ai';
  const set = <K extends keyof GarmentDraft>(field: K) => (value: GarmentDraft[K]) => onChange(editDraft(draft, field, value));
  const subcategories = SUBCATEGORIES[draft.category];

  const applyFabric = () => {
    const parsed = parseComposition(fabricText);
    if (!parsed.usable) {
      setFabricParts(parsed.shell);
      return;
    }
    setFabricParts(undefined);
    onChange(withComposition(draft, parsed, 'user'));
  };

  return (
    <View>
      <PhotoStrip
        uris={draft.imageUris}
        removeLabel={t('review.removePhoto')}
        onRemove={(uri) => onChange({ ...draft, imageUris: draft.imageUris.filter((u) => u !== uri) })}
      />
      <Button label={t('review.addPhoto')} variant="secondary" onPress={onAddPhoto} />
      <View style={styles.gap} />

      <Text style={styles.hint}>{t('review.aiHint')}</Text>
      <TextField
        label={t('review.name')}
        placeholder={t('review.namePlaceholder')}
        value={draft.name}
        onChangeText={set('name')}
        error={nameError}
        returnKeyType="done"
      />

      <ChipGroup
        mode="single"
        title={t('review.category')}
        options={CATEGORIES}
        selected={draft.category}
        aiSuggested={isAi('category')}
        labelOf={(c) => t(`enums.category.${c}`)}
        onChange={(category) => category && onChange({ ...editDraft(draft, 'category', category), subcategory: undefined })}
      />
      <ChipGroup
        mode="single"
        allowClear
        title={t('review.subcategory')}
        options={subcategories.includes(draft.subcategory ?? '') || !draft.subcategory ? subcategories : [draft.subcategory, ...subcategories]}
        selected={draft.subcategory}
        labelOf={(s) => subcategoryLabel(t, s)}
        onChange={set('subcategory')}
      />
      <ChipGroup
        mode="multi"
        title={t('review.colors')}
        options={COLORS}
        selected={draft.colors}
        aiSuggested={isAi('colors')}
        labelOf={(c) => colorLabel(t, c)}
        onChange={set('colors')}
      />
      <ChipGroup
        mode="single"
        allowClear
        title={t('review.pattern')}
        options={PATTERNS}
        selected={draft.pattern}
        labelOf={(p) => t(`enums.pattern.${p}`)}
        onChange={set('pattern')}
      />
      <ChipGroup
        mode="multi"
        title={t('review.seasons')}
        options={SEASONS}
        selected={draft.seasons}
        aiSuggested={isAi('seasons')}
        labelOf={(s) => t(`enums.season.${s}`)}
        onChange={set('seasons')}
      />
      <ChipGroup
        mode="multi"
        title={t('review.weather')}
        options={WEATHERS}
        selected={draft.weather}
        aiSuggested={isAi('weather')}
        labelOf={(w) => t(`enums.weather.${w}`)}
        onChange={set('weather')}
      />
      <ChipGroup
        mode="multi"
        title={t('review.occasions')}
        options={OCCASIONS}
        selected={draft.occasions}
        aiSuggested={isAi('occasions')}
        labelOf={(o) => t(`enums.occasion.${o}`)}
        onChange={set('occasions')}
      />
      <ChipGroup
        mode="single"
        allowClear
        title={t('review.formality')}
        options={FORMALITY_LEVELS}
        selected={draft.formality}
        aiSuggested={isAi('formality')}
        labelOf={String}
        onChange={set('formality')}
      />
      <ChipGroup
        mode="single"
        allowClear
        title={t('review.warmth')}
        options={WARMTH_LEVELS}
        selected={draft.warmth}
        aiSuggested={isAi('warmth')}
        labelOf={String}
        onChange={set('warmth')}
      />

      <SectionTitle>{t('review.fabric')}</SectionTitle>
      {draft.composition ? null : <Notice tone="warning" message={t('review.noMaterialBody')} />}
      <TextField
        placeholder={t('review.fabricPlaceholder')}
        hint={t('review.fabricHint')}
        value={fabricText}
        onChangeText={setFabricText}
        onSubmitEditing={applyFabric}
        autoCapitalize="none"
      />
      {fabricParts ? (
        <ErrorBanner error={appError('COMPOSITION_PARSE_FAILED')} />
      ) : null}
      {fabricParts && fabricParts.length > 0 ? (
        <Text style={styles.hint}>
          {t('review.parsedParts')} {fabricParts.map((p) => `%${p.percent} ${t(`enums.fiber.${p.fiber}`)}`).join(', ')}
        </Text>
      ) : null}
      <View style={styles.row}>
        <View style={styles.flex}>
          <Button label={t('review.applyFabric')} variant="secondary" onPress={applyFabric} disabled={fabricText.trim() === ''} />
        </View>
        <View style={styles.flex}>
          <Button label={t('review.labelPhoto')} variant="secondary" onPress={onLabelPhoto} />
        </View>
      </View>
      <View style={styles.gap} />
      <QualityBadge quality={assessQuality(draft)} />

      <SectionTitle>{t('review.brand')}</SectionTitle>
      <TextField value={draft.brand ?? ''} onChangeText={(brand) => onChange({ ...draft, brand: brand || undefined })} />
      <TextField
        label={t('review.notes')}
        value={draft.notes ?? ''}
        multiline
        onChangeText={(notes) => onChange({ ...draft, notes: notes || undefined })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  hint: { fontSize: fontSize.sm, color: colors.textMuted, marginBottom: spacing.md },
  row: { flexDirection: 'row', gap: spacing.sm },
  flex: { flex: 1 },
  gap: { height: spacing.md },
});
