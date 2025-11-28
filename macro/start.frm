VERSION 5.00
Begin {C62A69F0-16DC-11CE-9E98-00AA00574A4F} start 
   Caption         =   "CellBall"
   ClientHeight    =   3600
   ClientLeft      =   50
   ClientTop       =   380
   ClientWidth     =   5940
   OleObjectBlob   =   "start.frx":0000
   StartUpPosition =   1  'オーナー フォームの中央
End
Attribute VB_Name = "start"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = False
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = False


Private Sub Label1_Click()

Unload Me

End Sub

Private Sub Image1_Click()

End Sub

Private Sub saisho_Click()

    message.left = 0
    message.Caption = "初期データを読み込んでいます"
    start.Repaint
    Call 初期データロード
    Sheets("チーム情報").Calculate
    Sheets("data").Calculate
    Sheets("選手リスト").Calculate
    Sheets("選手データ").Calculate
    Sheets("一軍計算").Calculate
    Sheets("オーダー").Calculate
    Unload Me
    Sheets("top").Select
    shoki_settei.Show

End Sub

Private Sub UserForm_QueryClose(Cancel As Integer, CloseMode As Integer)

    If CloseMode = 0 Then
        Application.DisplayAlerts = False
        Workbooks("CellBall.xls").Close
        Application.DisplayAlerts = True
        Cancel = True
    End If
    
End Sub

Private Sub tuduki_Click()

Call データファイルオープン

If Not Workbooks("savedata.xls").Sheets("Sheet1").Range("C1") = "" Then
    message.left = 0
    message.Caption = "セーブデータを読み込んでいます"
    start.Repaint
    Call データロード
    Sheets("data").Calculate
    Sheets("選手リスト").Calculate
    Sheets("選手データ").Calculate
    Sheets("一軍計算").Calculate
    Sheets("オーダー").Calculate
    '試合結果シートに番号ふる
    Unload Me
    Sheets("top").Select
    main_menu.Show
Else
    MsgBox "セーブデータがありません"
    Call データファイルクローズ
End If

End Sub
