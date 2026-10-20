import { router } from 'expo-router';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Chip } from '@/components/Chip';
import { EmptyState } from '@/components/EmptyState';
import { GarmentCard } from '@/components/GarmentCard';
import { Notice } from '@/components/Notice';
import { TextField } from '@/components/TextField';
import { colors, fontSize, spacing } from '@/config/theme';
import { CATEGORIES, OCCASIONS, SEASONS, WEATHERS } from '@/domain/taxonomy';
import { filterGarments, isFilterActive, type WardrobeFilter } from '@/services/wardrobeFilter';
import { useWardrobeStore } from '@/store/wardrobeStore';

const FEW_ITEMS = 5;
const GRID_COLUMNS = 2;

interface FilterRowProps<K extends 'category' | 'season' | 'occasion' | 'weather'> {
  field: K;
  options: readonly NonNullable<WardrobeFilter[K]>[];
  labelOf: (value: NonNullable<WardrobeFilter[K]>) => string;
}

function FilterRow<K extends 'category' | 'season' | 'occasion' | 'weather'>({ field, options, labelOf }: FilterRowProps<K>) {
  const selected = useWardrobeStore((s) => s.filter[field]);
  const setFilter = useWardrobeStore((s) => s.setFilter);
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
      {options.map((value) => (
        <Chip
          key={String(value)}
          label={labelOf(value)}
          selected={selected === value}
          onPress={() => setFilter({ [field]: selected === value ? undefined : value })}
        />
      ))}
    </ScrollView>
  );
}

export default function WardrobeScreen() {
  const { t } = useTranslation();
  const garments = useWardrobeStore((s) => s.garments);
  const filter = useWardrobeStore((s) => s.filter);
  const setFilter = useWardrobeStore((s) => s.setFilter);
  const resetFilter = useWardrobeStore((s) => s.resetFilter);
  const visible = useMemo(() => filterGarments(garments, filter), [garments, filter]);
  const activeCount = garments.filter((g) => !g.archived).length;

  if (garments.length === 0) {
    return (
      <View style={styles.root}>
        <EmptyState
          title={t('wardrobe.emptyTitle')}
          body={t('wardrobe.emptyBody')}
          actionLabel={t('errorActions.add_item')}
          onAction={() => router.push('/add')}
        />
      </View>
    );
  }

  const header = (
    <View>
      <TextField
        placeholder={t('wardrobe.search')}
        value={filter.query}
        onChangeText={(query) => setFilter({ query })}
        returnKeyType="search"
        clearButtonMode="while-editing"
      />
      <FilterRow field="category" options={CATEGORIES} labelOf={(c) => t(`enums.category.${c}`)} />
      <FilterRow field="season" options={SEASONS} labelOf={(s) => t(`enums.season.${s}`)} />
      <FilterRow field="occasion" options={OCCASIONS} labelOf={(o) => t(`enums.occasion.${o}`)} />
      <FilterRow field="weather" options={WEATHERS} labelOf={(w) => t(`enums.weather.${w}`)} />
      <Text style={styles.count}>{t('wardrobe.count', { count: visible.length })}</Text>
      {activeCount < FEW_ITEMS ? <Notice message={t('wardrobe.fewItemsHint')} /> : null}
    </View>
  );

  return (
    <View style={styles.root}>
      <FlatList
        data={visible}
        keyExtractor={(g) => g.id}
        numColumns={GRID_COLUMNS}
        ListHeaderComponent={header}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => <GarmentCard garment={item} onPress={() => router.push(`/garment/${item.id}`)} />}
        ListEmptyComponent={
          isFilterActive(filter) ? (
            <EmptyState title={t('wardrobe.noResults')} actionLabel={t('wardrobe.clearFilters')} onAction={resetFilter} />
          ) : undefined
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background, paddingHorizontal: spacing.sm },
  list: { paddingVertical: spacing.md },
  filterRow: { marginBottom: spacing.xs },
  count: { fontSize: fontSize.sm, color: colors.textMuted, marginVertical: spacing.sm },
});
