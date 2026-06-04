import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { SituationDocument } from "@areeza/core/types";
import { PDF_FONT_FAMILY } from "./register-pdf-font";

const styles = StyleSheet.create({
  page: { padding: 48, fontFamily: PDF_FONT_FAMILY, fontSize: 11, lineHeight: 1.45 },
  section: { marginBottom: 12 },
});

export function LegalDocumentPdf({ document: doc }: { document: SituationDocument }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={{ fontSize: 14, marginBottom: 16 }}>{doc.title}</Text>
        {doc.sections.map((s) => (
          <View key={s.id} style={styles.section}>
            <Text>{s.content}</Text>
          </View>
        ))}
      </Page>
    </Document>
  );
}
