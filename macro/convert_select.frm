VERSION 5.00
Begin {C62A69F0-16DC-11CE-9E98-00AA00574A4F} convert_select 
   Caption         =   "コンバート指示"
   ClientHeight    =   4335
   ClientLeft      =   50
   ClientTop       =   380
   ClientWidth     =   3250
   OleObjectBlob   =   "convert_select.frx":0000
   StartUpPosition =   1  'オーナー フォームの中央
End
Attribute VB_Name = "convert_select"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = False
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = False
Private Sub CommandButton1_Click()

Range("キャンプ計算!AY" & Range("キャンプ計算!AX153").Value).Value = "なし"
Unload Me
Unload player_data

End Sub

Private Sub CommandButton2_Click()

Range("キャンプ計算!AY" & Range("キャンプ計算!AX153").Value).Value = "コンバート（捕）"
Unload Me
Unload player_data

End Sub

Private Sub CommandButton3_Click()

Range("キャンプ計算!AY" & Range("キャンプ計算!AX153").Value).Value = "コンバート（一）"
Unload Me
Unload player_data

End Sub

Private Sub CommandButton4_Click()

Range("キャンプ計算!AY" & Range("キャンプ計算!AX153").Value).Value = "コンバート（二）"
Unload Me
Unload player_data

End Sub

Private Sub CommandButton5_Click()

Range("キャンプ計算!AY" & Range("キャンプ計算!AX153").Value).Value = "コンバート（三）"
Unload Me
Unload player_data

End Sub

Private Sub CommandButton6_Click()

Range("キャンプ計算!AY" & Range("キャンプ計算!AX153").Value).Value = "コンバート（遊）"
Unload Me
Unload player_data

End Sub

Private Sub CommandButton7_Click()

Range("キャンプ計算!AY" & Range("キャンプ計算!AX153").Value).Value = "コンバート（外）"
Unload Me
Unload player_data

End Sub

