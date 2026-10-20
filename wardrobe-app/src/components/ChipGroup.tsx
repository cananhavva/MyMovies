import { StyleSheet, Text, View } from 'react-native';
import { colors, fontSize, spacing } from '@/config/theme';
import { Chip } from './Chip';

interface BaseProps<T extends string | number> {
  title?: string;
  options: readonly T[];
  labelOf: (value: T) => string;
  aiSuggested?: boolean;
}

interface MultiProps<T extends string | number> extends BaseProps<T> {
  mode: 'multi';
  selected: readonly T[];
  onChange: (values: T[]) => void;
}

interface SingleProps<T extends string | number> extends BaseProps<T> {
  mode: 'single';
  selected: T | undefined;
  /** Tapping the selected chip again clears it when `allowClear` is set. */
  allowClear?: boolean;
  onChange: (value: T | undefined) => void;
}

export function ChipGroup<T extends string | number>(props: MultiProps<T> | SingleProps<T>) {
  const isSelected = (value: T) => (props.mode === 'multi' ? props.selected.includes(value) : props.selected === value);

  const toggle = (value: T) => {
    if (props.mode === 'multi') {
      props.onChange(isSelected(value) ? props.selected.filter((v) => v !== value) : [...props.selected, value]);
    } else if (isSelected(value)) {
      if (props.allowClear) props.onChange(undefined);
    } else {
      props.onChange(value);
    }
  };

  return (
    <View style={styles.container}>
      {props.title ? <Text style={styles.title}>{props.title}</Text> : null}
      <View style={styles.row}>
        {props.options.map((value) => (
          <Chip
            key={String(value)}
            label={props.labelOf(value)}
            selected={isSelected(value)}
            aiSuggested={props.aiSuggested}
            onPress={() => toggle(value)}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: spacing.md },
  title: { fontSize: fontSize.sm, color: colors.textMuted, fontWeight: '600', marginBottom: spacing.sm },
  row: { flexDirection: 'row', flexWrap: 'wrap' },
});
