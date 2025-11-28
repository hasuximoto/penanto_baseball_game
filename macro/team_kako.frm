VERSION 5.00
Begin {C62A69F0-16DC-11CE-9E98-00AA00574A4F} team_kako 
   Caption         =   "過去のチーム成績"
   ClientHeight    =   5130
   ClientLeft      =   50
   ClientTop       =   380
   ClientWidth     =   9720
   OleObjectBlob   =   "team_kako.frx":0000
   StartUpPosition =   1  'オーナー フォームの中央
End
Attribute VB_Name = "team_kako"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = False
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = False

Private Sub miru_Click()

If ListBox1.Text = "" Then
    MsgBox "年度を選択してください"
Else
    Range("data!AA100").Value = ListBox1.List(ListBox1.ListIndex, 0)
    Range("data!Z101:AE126").Calculate
    team_kako_order.Show
End If


End Sub

Private Sub toziru_Click()

Unload Me


End Sub

Private Sub UserForm_Initialize()

Label1.Caption = Range("data!E101")
With ListBox1
    .ColumnCount = 15
    .ColumnWidths = "40;30;30;30;30;30;30;30;30;30;30;30;30;30;30"
    .RowSource = "data!K102:Y" & Range("data!J101")
    .ColumnHeads = True
End With

End Sub
