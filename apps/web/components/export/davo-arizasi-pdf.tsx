"use client";

import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import type { DocSection, GeneratedDocument } from "@areeza/core/types";
import { PDF_FONT_FAMILY } from "./register-pdf-font";

const styles = StyleSheet.create({
  page: {
    fontFamily: PDF_FONT_FAMILY,
    fontSize: 11,
    lineHeight: 1.55,
    paddingTop: 48,
    paddingBottom: 56,
    paddingHorizontal: 56,
    color: "#1a1814",
  },
  block: {
    marginBottom: 10,
  },
  court: {
    textAlign: "center",
    fontSize: 12,
    marginBottom: 14,
  },
  title: {
    textAlign: "center",
    fontWeight: 700,
    fontSize: 13,
    marginVertical: 10,
  },
  party: {
    fontSize: 10.5,
    marginBottom: 8,
  },
  monoLine: {
    fontSize: 9.5,
    letterSpacing: 0.2,
  },
  body: {
    textAlign: "justify",
    marginVertical: 6,
  },
  demand: {
    marginTop: 8,
    fontWeight: 700,
  },
  attachments: {
    marginTop: 10,
  },
  footer: {
    marginTop: 16,
    fontSize: 10.5,
  },
  line: {
    marginBottom: 3,
  },
});

function isMonoLine(line: string): boolean {
  return (
    line.includes("Hisob raqami") ||
    line.includes("STIR") ||
    line.includes("MFO") ||
    line.includes("Tel:") ||
    line.includes("e-mail")
  );
}

function SectionBlock({ section }: { section: DocSection }) {
  const lines = section.content.split("\n");

  if (section.kind === "header") {
    return (
      <View style={[styles.block, styles.court]} wrap={false}>
        {lines.map((line, i) => (
          <Text key={`${section.id}-h-${i}`} style={styles.line}>
            {line || " "}
          </Text>
        ))}
      </View>
    );
  }

  if (section.kind === "title") {
    return (
      <View style={[styles.block, styles.title]} wrap={false}>
        {lines.map((line, i) => (
          <Text key={`${section.id}-t-${i}`} style={styles.line}>
            {line}
          </Text>
        ))}
      </View>
    );
  }

  if (section.kind === "party") {
    return (
      <View style={[styles.block, styles.party]}>
        {lines.map((line, i) => (
          <Text
            key={`${section.id}-p-${i}`}
            style={isMonoLine(line) ? [styles.line, styles.monoLine] : styles.line}
          >
            {line}
          </Text>
        ))}
      </View>
    );
  }

  if (section.kind === "demand") {
    return (
      <View style={[styles.block, styles.demand]}>
        {lines.map((line, i) => (
          <Text key={`${section.id}-d-${i}`} style={styles.line}>
            {line}
          </Text>
        ))}
      </View>
    );
  }

  if (section.kind === "attachments") {
    return (
      <View style={[styles.block, styles.attachments]} break={lines.length > 8}>
        {lines.map((line, i) => (
          <Text key={`${section.id}-a-${i}`} style={styles.line} wrap>
            {line}
          </Text>
        ))}
      </View>
    );
  }

  if (section.kind === "footer") {
    return (
      <View style={[styles.block, styles.footer]} wrap={false}>
        {lines.map((line, i) => (
          <Text key={`${section.id}-f-${i}`} style={styles.line}>
            {line}
          </Text>
        ))}
      </View>
    );
  }

  return (
    <View
      style={
        section.kind === "body"
          ? [styles.block, styles.body]
          : styles.block
      }
    >
      {lines.map((line, i) => (
        <Text key={`${section.id}-${i}`} style={styles.line} wrap>
          {line || " "}
        </Text>
      ))}
    </View>
  );
}

export function DavoArizasiPdf({ document }: { document: GeneratedDocument }) {
  const sections =
    document.sections.length > 0
      ? document.sections
      : [{ id: "plain", kind: "body" as const, content: document.plainText, editable: false }];

  return (
    <Document title={document.title} author="Areeza">
      <Page size="A4" style={styles.page}>
        {sections.map((section) => (
          <SectionBlock key={section.id} section={section} />
        ))}
      </Page>
    </Document>
  );
}
