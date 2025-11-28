VERSION 5.00
Begin {C62A69F0-16DC-11CE-9E98-00AA00574A4F} draft_kaigi 
   Caption         =   "ドラフト会議"
   ClientHeight    =   7080
   ClientLeft      =   50
   ClientTop       =   440
   ClientWidth     =   12130
   OleObjectBlob   =   "draft_kaigi.frx":0000
   StartUpPosition =   1  'オーナー フォームの中央
End
Attribute VB_Name = "draft_kaigi"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = False
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = False
Private Sub Image3_Click()

Range("data!IR24") = 1
Range("data!IR3:IR7").Value = False
Range("data!IR2").Value = True

With player_list
    .CheckBox1.Value = True
    .CheckBox2.Value = False
    .CheckBox3.Value = False
    .CheckBox4.Value = False
    .CheckBox5.Value = False
    .CheckBox6.Value = False
End With
Range("data!IR24") = ""
player_list.Show


End Sub

Private Sub UserForm_QueryClose(Cancel As Integer, CloseMode As Integer)
    If CloseMode = 0 Then
        MsgBox "閉じられません", 48
        Cancel = True
    End If
End Sub

Private Sub kakunin_Click()

Range("ドラフト会議!ES50:EX59").Calculate
UserForm30.Show

End Sub

Private Sub Label2_Click()

End Sub


Private Sub ListBox1_change()

On Error GoTo エラー処理

If Not Range("ドラフト会議!FQ1").Value = ListBox1.List(ListBox1.ListIndex, 0) Then
    Range("ドラフト会議!FQ1").Value = ListBox1.List(ListBox1.ListIndex, 0)
    Range("ドラフト会議!FQ1").Value = ListBox1.List(ListBox1.ListIndex, 0)
    Range("ドラフト会議!FQ1:FQ20").Calculate
    senshu_name.Caption = Range("ドラフト会議!FQ1").Value
    simei.left = Range("ドラフト会議!FQ18").Value
    back_toshu.left = Range("ドラフト会議!FQ16").Value
    back_yashu.left = Range("ドラフト会議!FQ17").Value
    joho1.Caption = Range("ドラフト会議!FQ2").Value
    joho2.Caption = Range("ドラフト会議!FQ3").Value
    joho3.Caption = Range("ドラフト会議!FQ4").Value
    joho4.Caption = Range("ドラフト会議!FQ5").Value
    joho5.Caption = Range("ドラフト会議!FQ6").Value
    joho6.Caption = Range("ドラフト会議!FQ7").Value
    joho7.Caption = Range("ドラフト会議!FQ8").Value
    hosoku.Caption = Range("ドラフト会議!FQ9").Value
    rating5.Caption = Range("ドラフト会議!FQ10").Value
    rating1.Caption = Range("ドラフト会議!FQ11").Value
    rating2.Caption = Range("ドラフト会議!FQ12").Value
    rating3.Caption = Range("ドラフト会議!FQ13").Value
    rating4.Caption = Range("ドラフト会議!FQ14").Value
    komento.Caption = Range("ドラフト会議!FQ15").Value
End If

エラー処理:


End Sub

Private Sub owari_Click()

If Range("ドラフト会議!FA7") = 1 Then
    MsgBox "1位指名は必ず行ってください"
Else
    Range("ドラフト会議!FA29") = "指名終了"
    UserForm28.Show
End If

End Sub

Private Sub simei_Click()

UserForm28.Show

End Sub

Private Sub UserForm_Initialize()

junme.Caption = Range("ドラフト会議!ff22").Value

With ListBox1
    .ColumnCount = 6
    .ColumnWidths = "80;30;30,30,30,100"
    .RowSource = "ドラフト会議!GI2:GN" & Range("ドラフト会議!FZ1")
    .ColumnHeads = True
End With



End Sub

