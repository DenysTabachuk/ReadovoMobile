import { type ReactNode, useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import { type TableCell } from '@/api/wikipedia';
import { ThemedText } from '@/components/themedText';
import { useThemeColor } from '@/hooks/use-theme-color';

import { styles } from './styles';

type ArticleTableBlockProps = {
  renderCellContent: (params: {
    cell: TableCell;
    prefix: string;
    selectedTokenKey?: string;
  }) => ReactNode;
  rows: TableCell[][];
  selectedTokenKey?: string;
};

const WIDE_TABLE_COLUMN_COUNT = 3;
const MAX_SUMMARY_LINES = 2;

export function ArticleTableBlock({
  renderCellContent,
  rows,
  selectedTokenKey,
}: ArticleTableBlockProps) {
  const columnCount = useMemo(() => getTableColumnCount(rows), [rows]);
  const rowCount = rows.length;
  const isWideTable = columnCount >= WIDE_TABLE_COLUMN_COUNT;
  const [isExpanded, setIsExpanded] = useState(false);
  const borderColor = useThemeColor(
    { dark: 'rgba(255, 255, 255, 0.16)', light: 'rgba(17, 24, 28, 0.12)' },
    'icon',
  );
  const headerBackgroundColor = useThemeColor(
    { dark: 'rgba(255, 255, 255, 0.06)', light: 'rgba(17, 24, 28, 0.04)' },
    'background',
  );
  const tableBackgroundColor = useThemeColor({}, 'background');
  const headerText = isExpanded ? 'Hide table' : 'Show table';
  const summaryText = buildTableSummary(rows, columnCount, rowCount);
  const tableMinWidth = isWideTable ? Math.max(columnCount * 140, 420) : undefined;

  return (
    <View style={styles.container}>
      <Pressable
        accessibilityRole="button"
        onPress={() => setIsExpanded((currentValue) => !currentValue)}
        style={[
          styles.toggle,
          {
            backgroundColor: headerBackgroundColor,
            borderColor,
          },
        ]}>
        <View style={styles.toggleCopy}>
          <ThemedText type="bodyStrong">{headerText}</ThemedText>
          <ThemedText
            ellipsizeMode="tail"
            numberOfLines={MAX_SUMMARY_LINES}
            style={styles.summary}
            type="body">
            {summaryText}
          </ThemedText>
        </View>
        <ThemedText style={styles.chevron} type="bodyStrong">
          {isExpanded ? '−' : '+'}
        </ThemedText>
      </Pressable>

      {isExpanded ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator
          style={styles.tableViewport}
          contentContainerStyle={styles.tableViewportContent}>
          <View
            style={[
              styles.table,
              {
                backgroundColor: tableBackgroundColor,
                borderColor,
              },
              tableMinWidth ? { minWidth: tableMinWidth } : null,
            ]}>
            {rows.map((row, rowIndex) => (
              <View
                key={`row-${rowIndex}`}
                style={[
                  styles.tableRow,
                  {
                    borderBottomColor: borderColor,
                  },
                ]}>
                {row.map((cell, cellIndex) => (
                  <View
                    key={`cell-${rowIndex}-${cellIndex}`}
                    style={[
                      styles.tableCell,
                      {
                        borderColor,
                      },
                      isWideTable ? styles.tableWideCell : null,
                      cell.header
                        ? {
                            backgroundColor: headerBackgroundColor,
                          }
                        : null,
                    ]}>
                    <ThemedText
                      style={[styles.tableCellText, cell.header ? styles.tableHeaderText : null]}
                      type={cell.header ? 'bodyStrong' : 'body'}>
                      {renderCellContent({
                        cell,
                        prefix: `table-${rowIndex}-${cellIndex}`,
                        selectedTokenKey,
                      })}
                    </ThemedText>
                  </View>
                ))}
              </View>
            ))}
          </View>
        </ScrollView>
      ) : null}
    </View>
  );
}

function getTableColumnCount(rows: TableCell[][]): number {
  return rows.reduce((maxCount, row) => Math.max(maxCount, row.length), 0);
}

function buildTableSummary(
  rows: TableCell[][],
  columnCount: number,
  rowCount: number,
): string {
  const title = rows.find((row) => row.length === 1)?.[0]?.text?.trim();

  if (title) {
    return `${title} • ${columnCount} cols • ${rowCount} rows`;
  }

  return `${columnCount} cols • ${rowCount} rows`;
}
