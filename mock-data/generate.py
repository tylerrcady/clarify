import pandas as pd

# Create mock data with the same schema
mock_data = pd.DataFrame({
    "Name": ["Doe, John A", "Smith, Jane B", "Brown, Charlie C"], # ! important
    "Email": ["tylercadya@gmail.com", "tylercadyb@gmail.com", "tylercadyc@gmail.com"], # ! important
    "GT ID": [903111111, 903222222, 903333333], # not important
    "GT Account": ["jdoe3", "jsmith9", "cbrown7"], # not important
    "Major(s)": [ # not important
        "us/c/coc/bscs/a/cs/cs08/info/internetwork-infrastructure",
        "us/c/coc/bscs/a/cs/cs30/info/internetwork-systems",
        "us/m/mgt/bsba/a/ba/mg04/information technology management"
    ],
    "Role": ["Student", "Ta", "Teacher"], # ! important
    "Section(s)": [ # not important
        "202408/CS/2200/A/80169, 202408/CS/2200/A03/88677",
        "202408/CS/2200/A/80169, 202408/CS/2200/A04/88678",
        "202408/CS/2200/A/80169, 202408/CS/2200/A05/88679"
    ],
    "Confidential?": [None, None, None], # not important
    "Grade Mode": ["Letter Grade", "Letter Grade", "Letter Grade"], # not important
    "Last course activity": ["2024-12-10 10:00 EST", "2024-12-12 14:30 EST", "2024-12-15 09:45 EST"], # not important
    "Total course activity": ["100:30:15", "120:45:30", "95:20:10"] # not important
})

# Save the mock data to a new Excel file
mock_file_path = "mock-data/xlsx-mock-roster.xlsx"
with pd.ExcelWriter(mock_file_path) as writer:
    mock_data.to_excel(writer, sheet_name="Roster", index=False)