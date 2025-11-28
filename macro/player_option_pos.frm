VERSION 5.00
Begin {C62A69F0-16DC-11CE-9E98-00AA00574A4F} player_option_pos 
   Caption         =   "ポジション設定"
   ClientHeight    =   1935
   ClientLeft      =   50
   ClientTop       =   380
   ClientWidth     =   4060
   OleObjectBlob   =   "player_option_pos.frx":0000
   StartUpPosition =   1  'オーナー フォームの中央
End
Attribute VB_Name = "player_option_pos"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = False
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = False
Private Sub henko_Click()

Range(Range("data!I309").Value).Value = Range("Sheet3!E" & 34 + ComboBox1.ListIndex).Value
player_data.team_name.Caption = Range("data!G301") & "／" & Range("Sheet3!C" & 34 + ComboBox1.ListIndex).Value
Unload Me
Unload player_option

End Sub



Private Sub Label3_Click()

Unload Me
Unload player_option

End Sub

Private Sub UserForm_Initialize()

10  For i = 0 To 5
20      ComboBox1.AddItem Worksheets("Sheet3").Cells(i + 34, 3).Value
30  Next
ComboBox1.ListIndex = 1
ComboBox1.Style = fmStyleDropDownList

End Sub
