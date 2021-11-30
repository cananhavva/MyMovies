package com.mymovies.server.data;

import java.io.BufferedReader;
import java.io.Externalizable;
import java.io.File;
import java.io.FileReader;
import java.io.IOException;
import java.io.ObjectInput;
import java.io.ObjectOutput;
import java.util.Arrays;
import java.util.StringTokenizer;

import com.bilgeadam.boost.course01.mymovies.server.common.CommonData;
import com.bilgeadam.boost.course01.mymovies.utils.Props;

public class Name implements Externalizable {
	private static final long serialVersionUID = 1234567891L;
	private String            id;
	private String            primaryName;
	private int               birthYear;
	private int               deathYear;
	private String[]          professions;
	private String[]          knownForTitles;

	public Name() {
		super();
	}

	// nconst primaryName birthYear deathYear primaryProfession knownForTitles
	private static Name parse(String line) {
		Name            name      = new Name();
		StringTokenizer tokenizer = new StringTokenizer(line, "\t");
		name.id          = tokenizer.nextToken();
		name.primaryName = tokenizer.nextToken();

		String token = tokenizer.nextToken();
		if (token.equalsIgnoreCase("\\N")) {
			name.deathYear = CommonData.UNSPECIFIED;
		}
		else {
			name.birthYear = Integer.parseInt(token);

			token = tokenizer.nextToken();
			if (token.equalsIgnoreCase("\\N")) {
				name.deathYear = CommonData.UNSPECIFIED;
			}
			else {
				name.deathYear = Integer.parseInt(token);
			}

			token = tokenizer.nextToken();
			if (token.equalsIgnoreCase("\\N")) {
				name.professions    = new String[1];
				name.professions[0] = CommonData.UNKNOWN;
			}
			else {
				StringTokenizer professions    = new StringTokenizer(token, ",");
				int             numProfessions = professions.countTokens();
				name.professions = new String[numProfessions];
				for (int i = 0; i < numProfessions; i++) {
					name.professions[i] = professions.nextToken().strip();
				}
			}

			if (tokenizer.hasMoreTokens()) {
				token = tokenizer.nextToken();
				if (token.equalsIgnoreCase("\\N")) {
					name.knownForTitles    = new String[1];
					name.knownForTitles[0] = CommonData.UNKNOWN;
				}
				else {
					StringTokenizer titles    = new StringTokenizer(token, ",");
					int             numTitles = titles.countTokens();
					name.knownForTitles = new String[numTitles];
					for (int i = 0; i < numTitles; i++) {
						name.knownForTitles[i] = titles.nextToken().strip();
					}
				}
			}
		}
		return name;
	}

	public static void read() {
		CommonData.getInstance().logInfo(("Reading names data"));

		File file = new File(Props.getInstance().getNamesTSVFile());

		int nameCnt = 0;
		try (FileReader fR = new FileReader(file); BufferedReader bR = new BufferedReader(fR);) {

			while (true) {
				String line;
				try {
					line = bR.readLine();
					if (line == null) {
						break;
					}
					if (line.startsWith("nconst")) {
						continue;
					}
					Name name = Name.parse(line);
					nameCnt++;
					CommonData.getInstance().addName(name);
				}
				catch (Error err) {
					System.out.println(nameCnt);
					err.printStackTrace();
				}
				catch (IOException ex) {
					System.out.println(nameCnt);
					ex.printStackTrace();
				}
				catch (Throwable t) {
					System.out.println(nameCnt);
					t.printStackTrace();
				}
			}
		}
		catch (IOException ex) {
			CommonData.getInstance().logError(ex.getMessage());
		}
		CommonData.getInstance().logInfo(nameCnt + " records read from names data");
	}

	@Override
	public String toString() {
		return "Name [id=" + this.id + ", primaryName=" + this.primaryName + ", birthYear=" + this.birthYear
				+ ", deathYear=" + this.deathYear + ", professions=" + Arrays.toString(this.professions)
				+ ", knownForTitles=" + Arrays.toString(this.knownForTitles) + "]";
	}

	public String getId() {
		return this.id;
	}

	public String getPrimaryName() {
		return this.primaryName;
	}

	public int getBirthYear() {
		return this.birthYear;
	}

	public int getDeathYear() {
		return this.deathYear;
	}

	public String[] getProfessions() {
		return this.professions;
	}

	public String[] getKnownForTitles() {
		return this.knownForTitles;
	}

	@Override
	public void writeExternal(ObjectOutput out) throws IOException {
		out.writeUTF(id);
		out.writeUTF(primaryName);
		out.writeInt(birthYear);
		out.writeInt(deathYear);
		if (this.professions == null) {
			out.writeInt(0);
		}
		else {
			out.writeInt(professions.length);
			for (String profession : professions) {
				out.writeUTF(profession);
			}
		}
		if (this.knownForTitles == null) {
			out.writeInt(0);
		}
		else {

			out.writeInt(knownForTitles.length);
			for (String title : knownForTitles) {
				out.writeUTF(title);
			}
		}
	}

	@Override
	public void readExternal(ObjectInput in) throws IOException, ClassNotFoundException {
		this.id          = in.readUTF();
		this.primaryName = in.readUTF();
		this.birthYear   = in.readInt();
		this.deathYear   = in.readInt();
		int len = in.readInt();
		if (len != 0) {
			this.professions = new String[len];
			for (int i = 0; i < this.professions.length; i++) {
				this.professions[i] = in.readUTF();
			}
		}

		len = in.readInt();
		if (len != 0) {
			this.knownForTitles = new String[len];
			for (int i = 0; i < this.knownForTitles.length; i++) {
				this.knownForTitles[i] = in.readUTF();
			}
		}
	}
	
	static public String[] MovieIds(String actorName) {
		String[] retValue = null;
		Name name = CommonData.getInstance().getNames().get(actorName);
		if (name != null) {
			retValue = name.knownForTitles;  //tt0050419,tt0031983,tt0053137,tt0072308 gibi bir liste geliyor e�er akt�r tan�ml� ise
		}
		return retValue;
	}
}
