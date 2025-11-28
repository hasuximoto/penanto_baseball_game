VERSION 5.00
Begin {C62A69F0-16DC-11CE-9E98-00AA00574A4F} game_skip 
   Caption         =   "日程スキップ"
   ClientHeight    =   2230
   ClientLeft      =   50
   ClientTop       =   380
   ClientWidth     =   6240
   OleObjectBlob   =   "game_skip.frx":0000
   StartUpPosition =   1  'オーナー フォームの中央
End
Attribute VB_Name = "game_skip"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = False
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = False
Private Sub back_Click()

Unload Me

End Sub

Private Sub TextBox1_Change()

Dim atai
If Me.TextBox1 = "" Then Exit Sub  '空の場合のMSGBOX表示しないため
atai = Me.TextBox1  '入力文字の取得
atai = IsNumeric(atai)  '数字判定
If atai = False Then
MsgBox "数字を入力してください。"
Me.TextBox1 = ""
Me.TextBox1.SetFocus
End If

End Sub

Private Sub zikkou_Click()

Range("data!C34") = TextBox1.Value
Call オート進行
Unload Me

End Sub
