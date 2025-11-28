VERSION 5.00
Begin {C62A69F0-16DC-11CE-9E98-00AA00574A4F} zanryu_koushou_kekka 
   Caption         =   "残留交渉結果"
   ClientHeight    =   6615
   ClientLeft      =   50
   ClientTop       =   380
   ClientWidth     =   6480
   OleObjectBlob   =   "zanryu_koushou_kekka.frx":0000
   StartUpPosition =   1  'オーナー フォームの中央
End
Attribute VB_Name = "zanryu_koushou_kekka"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = False
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = False


Private Sub UserForm_Initialize()

ListBox1.RowSource = "data!U1085:U1100"
ListBox2.RowSource = "data!V1085:V1100"
ListBox3.RowSource = "data!W1085:W1100"

yosan1.Caption = Range("data!Q1087").Value
yosan2.Caption = Range("data!S1087").Value
yosan3.Caption = Range("data!T1087").Value

Range("data!Q1089").Value = Range("data!S1086").Value

End Sub

Private Sub zanryu_end_Click()

zanryu_end.left = 700
zanryu_koushou_kekka.Repaint
Call 残留交渉結果
Unload Me
stove_league.Show

End Sub
