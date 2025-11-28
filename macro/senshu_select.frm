VERSION 5.00
Begin {C62A69F0-16DC-11CE-9E98-00AA00574A4F} senshu_select 
   Caption         =   "選手選択"
   ClientHeight    =   5400
   ClientLeft      =   50
   ClientTop       =   380
   ClientWidth     =   8860
   OleObjectBlob   =   "senshu_select.frx":0000
   StartUpPosition =   1  'オーナー フォームの中央
End
Attribute VB_Name = "senshu_select"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = False
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = False


Private Sub kettei_Click()

If ListBox1.List(ListBox1.ListIndex, 4) = "" Then
    Range("FA選手!DQ179").Value = ListBox1.List(ListBox1.ListIndex, 0)
    Unload Me
Else
    MsgBox "この選手はトレードできません。"
End If

End Sub

Private Sub kyanseru_Click()

Unload Me

End Sub

Private Sub UserForm_Initialize()

Label1.Caption = Range("FA選手!DT258").Value

With ListBox1
    .ColumnCount = 5
    .ColumnWidths = "80;30;50;130;80"
    .RowSource = "FA選手!DR187:DV" & Range("FA選手!DQ186")
    .ColumnHeads = True
    .MultiSelect = fmMultiSelectSingle
    .ListStyle = fmListStyleOption
End With

End Sub

