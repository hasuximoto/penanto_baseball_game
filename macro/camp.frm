VERSION 5.00
Begin {C62A69F0-16DC-11CE-9E98-00AA00574A4F} camp 
   Caption         =   "コンバート指示"
   ClientHeight    =   6670
   ClientLeft      =   50
   ClientTop       =   380
   ClientWidth     =   9370
   OleObjectBlob   =   "camp.frx":0000
   StartUpPosition =   1  'オーナー フォームの中央
End
Attribute VB_Name = "camp"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = False
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = False


Private Sub UserForm_QueryClose(Cancel As Integer, CloseMode As Integer)
    If CloseMode = 0 Then
        MsgBox "閉じられません", 48
        Cancel = True
    End If
End Sub

Private Sub kettei_Click()

MsgBox "キャンプ実行～開幕の準備をします。OKをクリック後しばらくお待ちください。"

Call オフシーズン終了
Unload Me
MsgBox "新しいシーズンが開幕しました。"
Unload main_menu
Load main_menu
main_menu.Show

End Sub

Private Sub sizi_Click()

If ListBox1.Text = "" Then
    MsgBox "選手を選択してください"
Else
    Range("data!C301").Value = ListBox1.List(ListBox1.ListIndex, 0)
    Range("キャンプ計算!AX154").Value = ListBox1.List(ListBox1.ListIndex, 0)
    Range("キャンプ計算!AX153").Calculate
    Range("data!L301") = "コンバート指示"
    Call 選手データオープン
    Range("data!L301") = ""
    With ListBox1
        .ColumnCount = 6
        .ColumnWidths = "80;80;30,30,130,100"
        .RowSource = "キャンプ計算!AX101:BC" & Range("キャンプ計算!BD100")
        .ColumnHeads = True
    End With
End If


End Sub

Private Sub UserForm_Initialize()


With ListBox1
    .ColumnCount = 6
    .ColumnWidths = "80;80;30,30,130,100"
    .RowSource = "キャンプ計算!AX101:BC" & Range("キャンプ計算!BD100")
    .ColumnHeads = True
End With


End Sub
