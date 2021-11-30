package com.mymovies.client.view;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Scanner;
import java.util.StringTokenizer;
import java.util.stream.Collectors;

public class Menu {

	private String              title         = "";
	private String              body          = "";
	private String              selectMessage = "";
	private int                 lineLength    = 40;
	private Map<Object, String> menu;
	private List<String>        listRow;
	private char                icon          = '\u2592'; // Alt + 176 = ░ Alt + 177 = ▒ Alt + 178 = ▓
	private Scanner             in            = null;
	private int                 keyLengthMax  = 1;

	public Menu(Builder build) {
		this.title         = build.title;
		this.body          = build.body;
		this.selectMessage = build.selectMessage;
		this.lineLength    = build.lineCount;
		this.menu          = build.menu;
		this.listRow       = build.listRow;
		this.icon          = build.icon;
		in                 = new Scanner(System.in);
	}

//	public static void main(String[] args) {
//		new MenuBuilder.Builder().title("Başlık").build().show();
//	}
	public Menu show() {
		int rowCount = rowCountFind();
		if (rowCount > lineLength)
			lineLength = rowCount;
		printLine(lineLength);
		if (!title.isEmpty())
			centerWrite(title.toUpperCase());
		if (!body.isEmpty())
			centerWrite(toPascalCaseString(body));
		centerWrite("");
		if (menu != null) {
			showMenu();
			centerWrite("");
		}
		if (listRow != null) {
			showRows();
			centerWrite("");
		}
		printLine(lineLength);
		if (!selectMessage.isEmpty()) {
			centerWrite(toPascalCaseString(selectMessage));
			printLine(lineLength);
		}

		return this;
	}

	public int readInteger() {

		String secim;

		do {
			try {

				boolean isDigit = true;
				secim = in.nextLine().trim();
				for (int i = 0; i < secim.length(); i++) {
					if (!Character.isDigit(secim.charAt(i))) {
						isDigit = false;
					}
				}

				if (isDigit)
					return Integer.parseInt(secim);
			}
			catch (Exception e) {

			}
		} while (true);
	}

	public String readString() {

		String strLine = "";
		do {
			try {

				strLine = in.nextLine();

				return strLine;
			}
			catch (Exception e) {
				System.out.println(strLine + " = " + e.getMessage());
			}
		} while (true);

	}

	private void showMenu() {
		for (Map.Entry<Object, String> entry : menu.entrySet()) {
			Object key = entry.getKey();
			String val = entry.getValue();
			if (key instanceof Integer) {

				String row   = String.format(icon + " %02d - %s", (int) key, val.trim());
				int    space = (lineLength - row.length());
				if (space <= 0)
					space = 1;
				System.out.printf("%s%" + space + "s", row, icon);
			}

			if (key instanceof String) {
				String row   = String.format(icon + " %-" + keyLengthMax + "s %s", key.toString(), val.trim());
				int    space = (lineLength - row.length());
				if (space <= 0)
					space = 1;
				row = row.concat(String.format("%" + space + "s", icon));

				System.out.print(row);
			}
			System.out.println();
		}
	}

	private void showRows() {
		for (String entry : this.listRow) {

			String row = String.format(icon + " %s", entry.trim());
			row = row.concat(String.format("%" + (lineLength - row.length()) + "s", icon));
			System.out.print(row);

			System.out.println();
		}
	}

	private int rowCountFind() {
		List<Integer> rowCount = new ArrayList<>();
		rowCount.add(title.length());
		rowCount.add(body.length());
		rowCount.add(selectMessage.length());

		rowCount = rowCount.stream().sorted().collect(Collectors.toList());

		return rowCount.get(rowCount.size() - 1) + 4;
	}

	public void centerWrite(String msg) {
		int    length = msg.length() + 4;
		String row    = icon + " ";
		if (lineLength > length) {
			int space = (int) Math.abs(Math.ceil((lineLength - length) / 2));
			space  = space == 0 ? 1 : space;
			row   += String.format("%-" + space + "s", " ");

		}
		row = row.concat(msg);
		System.out.printf("%s%" + (lineLength - row.length()) + "s%n", row, icon);

	}

	private void printLine(int msgLong) {

		StringBuilder line = new StringBuilder();
		for (int i = 0; i < msgLong; i++) {
			line.append(icon);
		}
		System.out.printf("%s\n", line);
	}

	public String toPascalCaseString(String metin) {
		StringTokenizer st       = new StringTokenizer(metin, " ");
		StringBuilder   newMetin = new StringBuilder();
		while (st.hasMoreTokens()) {
			String A = st.nextToken();
			A = A.substring(0, 1).toUpperCase().concat(A.substring(1, A.length()));
			newMetin.append(A);
			newMetin.append(" ");
		}

		return newMetin.toString();
	}

	public void addMenu(Object obj, String msj) {
		if (menu == null) {
			this.menu = new LinkedHashMap<Object, String>();
		}

		int count = msj.length() + obj.toString().length();
		if (count > lineLength) {
			this.lineLength = count + 6;
		}
		this.menu.put(obj, msj);

	}

	public void addRow(String msj) {
		if (listRow == null) {
			this.listRow = new ArrayList<>();

		}
		if (lineLength < msj.length()) {
			this.lineLength = msj.length() + 6;
		}
		this.listRow.add(msj);

	}

	public void addRowLine() {
		addRow("*".repeat(lineLength));
	}

	public void removeMenu(Object key) {
		if (this.menu.containsKey(key))
			this.menu.remove(key);

	}

	// Builder Design
	public static class Builder {
		private String              title         = "";
		private String              body          = "";
		private String              selectMessage = "";
		private int                 lineCount     = 40;
		private Map<Object, String> menu          = null;
		private List<String>        listRow;
		private char                icon          = '\u2592';// Alt + 176 = ░ Alt + 177 = ▒ Alt + 178 =
																// ▓

		public Builder() {
			super();

		}

		public Builder title(String title) {
			this.title = title;
			return this;
		}

		public Builder icon(char icon) {
			this.icon = icon;
			return this;
		}

		public Builder body(String body) {
			this.body = body;
			return this;
		}

		public Builder selectMessage(String selectMessage) {
			this.selectMessage = selectMessage;
			return this;
		}

		public Builder addMenu(Object obj, String msj) {
			if (menu == null) {
				this.menu = new LinkedHashMap<Object, String>();

			}
			int count = msj.length() + obj.toString().length() + 4;
			if (lineCount < count) {
				this.lineCount = count;
			}
			this.menu.put(obj, msj);
			this.menu.put(obj, msj);

			return this;
		}

		public Builder addRow(String msj) {
			if (listRow == null) {
				this.listRow = new ArrayList<String>();

			}
			this.listRow.add(msj);
			if (lineCount < msj.length()) {
				this.lineCount = msj.length();
			}
			return this;
		}

		public Builder lineCount(int lineCount) {
			this.lineCount = lineCount;
			return this;
		}

		public Menu build() {
			return new Menu(this);
		}
	}
}
