VERSION 5.00
Begin {C62A69F0-16DC-11CE-9E98-00AA00574A4F} team_kako_order 
   Caption         =   "過去のオーダー"
   ClientHeight    =   6180
   ClientLeft      =   50
   ClientTop       =   380
   ClientWidth     =   8260
   OleObjectBlob   =   "team_kako_order.frx":0000
   StartUpPosition =   1  'オーナー フォームの中央
End
Attribute VB_Name = "team_kako_order"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = False
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = False
Private Sub Image1_Click()

Unload Me

End Sub

Private Sub UserForm_Initialize()

Label1.Caption = Range("data!AA100") & "年 " & Range("data!E101")
With ListBox1
    .ColumnCount = 5
    .ColumnWidths = "30;30;80;140;80"
    .RowSource = "data!AA102:AE113"
    .ColumnHeads = True
End With
With ListBox2
    .ColumnCount = 5
    .ColumnWidths = "30;30;80;140;80"
    .RowSource = "data!AA115:AE126"
    .ColumnHeads = True
End With

End Sub

