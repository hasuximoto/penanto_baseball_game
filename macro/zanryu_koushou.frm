VERSION 5.00
Begin {C62A69F0-16DC-11CE-9E98-00AA00574A4F} zanryu_koushou 
   Caption         =   "残留交渉"
   ClientHeight    =   6015
   ClientLeft      =   50
   ClientTop       =   380
   ClientWidth     =   8070
   OleObjectBlob   =   "zanryu_koushou.frx":0000
   StartUpPosition =   1  'オーナー フォームの中央
End
Attribute VB_Name = "zanryu_koushou"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = False
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = False
Private Sub Image2_Click()

End Sub

Private Sub kousho_end_Click()

Range("data!D1103") = ""

If Range("data!Q1086") >= Range("data!R1086") Then
    '乱数
    Dim i As Integer
    For i = 1002 To 1081
        Range("data!AE" & i).Value = Rnd
    Next
    Range("data!A1000:BZ1105").Calculate
    Range("data!AG1002:AG1081").Value = Range("data!R1002:R1081").Value
    Range("data!AH1002:AI1081").Value = Range("data!X1002:Y1081").Value
    Range("data!AJ1002:AJ1081").Value = Range("data!AC1002:AC1081").Value
    Unload Me
    zanryu_koushou_kekka.Show
Else
    MsgBox "予算をオーバーしています"
End If

End Sub

Private Sub kosho_Click()


If ListBox1.Text = "" Then
    MsgBox "選手を選択してください"
Else
    Range("data!C301").Value = ListBox1.List(ListBox1.ListIndex, 0)
    Range("data!C1103").Value = Range("data!C301").Value
    Range("data!A1000:BZ1105").Calculate
    Range("data!D1103:F1103").Value = Range("data!R1083:T1083").Value
    Range("data!A1000:BZ1105").Calculate
    Range("data!L301") = "契約提示"
    Call 選手データオープン
End If

yosan2.Caption = Range("data!R1087").Value

End Sub

Private Sub Label8_Click()

Unload Me

End Sub

Private Sub UserForm_QueryClose(Cancel As Integer, CloseMode As Integer)
    If CloseMode = 0 Then
        MsgBox "[×]ボタンでは閉じられません。", 48
        Cancel = True
    End If
End Sub

Private Sub UserForm_Initialize()

With ListBox1
    .ColumnCount = 4
    .ColumnWidths = "80;120;50;100"
    .RowSource = "data!R1002:U" & Range("data!Q1083") + 1001
    .ColumnHeads = True
End With

yosan1.Caption = Range("data!Q1087").Value
yosan2.Caption = Range("data!R1087").Value

End Sub
